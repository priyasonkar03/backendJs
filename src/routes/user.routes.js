import { Router } from "express";
import {loginUser, 
        logoutUser, 
        refreshAccessToken, 
        registerUser } from "../controllers/user.controller.js";
// import {upload} from "../middlewares/multer.middleware.js"
import { uploadFields } from "../middlewares/multer.middleware.js"  //fpr avatar upload
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    //upload images from middlewares multer.js
    // upload.fields([
    //     {
    //         name : "avater",
    //         maxCount : 1
    //     },{
    //         name : "coverImage",
    //         maxCount: 1
    //     }
    // ]),
    uploadFields,
    registerUser
    )
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("refresh-token").post(refreshAccessToken)
export default router