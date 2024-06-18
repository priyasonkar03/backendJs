import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
// import { uploadFields } from "../middlewares/multer.middleware.js"
// import multer from "multer"

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        console.log("Finding user with ID:", userId);
        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found for ID:", userId);
            throw new ApiError(404, "User not found");
        }

        // console.log("Generating access token");
        const accessToken = user.generateAccessToken();
        // console.log("Access token generated:", accessToken);

        // console.log("Generating refresh token");
        const refreshToken = user.generateRefreshToken();
        // console.log("Refresh token generated:", refreshToken);

        
        user.refreshToken = refreshToken
        console.log("Saving user with new refresh token");
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        console.error("Error in generateAccessAndRefereshTokens:", error);
        if (error instanceof ApiError) {
            throw error; // Re-throw specific API errors
        }
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};


//--------User Register-------------
const registerUser = asyncHandler(async (req,res) => {
    // res.status(200).json({
    //     message: "Radhe Shyam"
    // })

    //========Steps for register===
    // 1) get user details from frontend
    // 2) validation - not empty
    // 3) check if user already exists: username, email
    // 4) check for images, check for avatar
    // 5) upload them to clodinary, avatar
    // 6) create user object - create entry in db
    // 7)remove password and refresh token field from response
    // 8) check for user creation
    // 9) return res

    const {fullName, email , username, password} = req.body
    console.log("email: ", email);
    //==================second steps validation=============
    // if (fullName === ""){
    //     throw new ApiError(400, "fullname is required")
    // }
    //===============second method
    if(
        [fullName,email,username,password].some((field) => 
        field?.trim() === "")
    )
    {
        throw new ApiError (400,"All fields are required")
    }
    //==============third step check ther user already exits
    // user hi call karega mongodb ko direct 
   const existedUser = await User.findOne({
        //here used operators by $
        $or : [{ username }, { email }]
        
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exits")
    }
    //============fourth step for avatar
    // const avatarlocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let avatarLocalPath , coverImageLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    }
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    
    
    //===========5) steps=upload on clodinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
 
   //==========step 6) create the object and store the data on database
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",         //conner case (if coverimg then passed url otherwise empty)
        email,
        password,
        username:username.toLowerCase()
    })

    // 7) remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        //- ve sign used for password nhi chiye in this case used beared syntax (-password -refreshToken)
        "-password -refreshToken"
    )
    // 8) check user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    // 9) return res
    // return res.status(201).json({createdUser})
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User regidterd successsfully")
    )
})

//--------Login -------------
const loginUser = asyncHandler(async (req, res) => {
    //req body --> data
    //username or email
    // find the user
    //password check
    // access and refresh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);
    // if(!username || !email){
        // if(!(username || email)){
        if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invaild user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    // send the Cookies 
    const options = {
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, 
                accessToken, 
                refreshToken 
            },
            "User logged in Successfully"
        )
    )
})

//---------User logout---------
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(               //mistack here await not use in my code
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

//---------------End point where user for refreshaccesstoken 
const refreshAccessToken = asyncHandler(async(req, res) => {

   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
   }

   //=========token verify by jsonwebtoken
 try {
      const decodedToken = jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
      )
      
       //------find by id from mongodb
       const user = await User.findById(decodedToken?._id)
   
       if(!user){
           throw new ApiError (401, "Invalid refresh token")
       }
   
       if(incomingRefreshToken !== user?.refreshToken){
           throw new ApiError (401, "Refresh token is expired or used")
       }
   
       const options = {
           httpOnly: true,
           secure: true
       }
       const {accessToken, newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
   
       return res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newrefreshToken, options)
       .json(
           new ApiResponse(
               200,
               {accessToken, newrefreshToken},
               "Access token refreshed"
           )
       )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }   
})

//============from users current password change
const changeCurrentPassword = asyncHandler(async(req,res)=> {

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json (new ApiResponse(200, {}, "Passsword changed successfully"))
})

//===========should be current user 
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
});

//=========update user account details============
const updateAccountDetails = asyncHandler(async(req, res) =>{
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            //user mongoose operator $set
            $set:{
                fullName : fullName,
                email : email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

//=========update user's avatar
const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError (400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiError(200, user, "Cover image updated successfully")
    )
})
//========Update user's coverimage
const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError (400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url){
        throw new ApiError(400, "Error while uploading on Cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiError(200, user, "Cover image updated successfully")
    )
})
export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}

