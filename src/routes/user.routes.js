import { Router } from "express";
import {changeCurrentPassword, 
        getCurrentUser, 
        getUserChannelProfile, 
        getWatchHistory, 
        loginUser, 
        logoutUser, 
        refreshAccessToken, 
        registerUser, 
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage} from "../controllers/user.controller.js";
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
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, uploadFields.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, uploadFields.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router