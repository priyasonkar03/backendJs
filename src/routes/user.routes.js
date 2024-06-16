import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

// import {upload} from "../middlewares/multer.middleware.js"
import { uploadFields } from "../middlewares/multer.middleware.js"

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
// router.route("/login").post(login)

export default router