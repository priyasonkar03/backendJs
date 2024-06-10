import express from  'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))
 //three major configurations
app.use(express.json({limit:"16kb"}))  
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))   //public used for image icon
app.use(cookieParser())


//routes import 
import userRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter)       //right the middleware

export { app }