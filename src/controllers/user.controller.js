import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
   const existedUser = User.findOne({
        //here used operators by $
        $or : [{username}, {email}]
        
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exits")
    }
    //============fourth step for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    //===========fifth steps=upload on clodinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
    //==========sixth step create the object and store the data on database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",         //conner case (if coverimg then passed url otherwise empty)
        email,
        password,
        username:username.toLowerCase()
    })
    // 7)remove password and refresh token field from response
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

export {registerUser}