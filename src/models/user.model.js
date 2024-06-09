import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema({
    username:{
        type : String,
        require: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email:{
        type : String,
        require: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName:{
        type : String,
        require: true,
        trim: true,
        index: true
    },
    avatar:{
        type : String,      //cloudinary url
        require: true,
    },
    coverImage:{
        type : String, //cloudinary url
    },
    watchHistory:[
        {
            type : Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type : String,
        required : [true, "Password is required"]
    },
    refreshToken:{
        type : String
    }
},{timestamps:true})
//===========Password===============
//use pre hooks  for middlewar
userSchema.pre("save",async function(next) {
    //This logic used for password encryption
    if(!this.isModified("password")) return next();
    
    this.password = bcrypt.hash(this.password, 10)
    next()
})

//custom methods
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.method.generateAccessToken = function(){
    return  jwt.sign({
        _id: this._id,
        email: this.email,
        username : this.username,
        fullName : this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
userSchema.method.generateRefreshToken = function(){
    return  jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

//=================***********=========================

export const user = mongoose.model("User", userSchema)