import { Router } from "express";
import {
	getAllDoctors,
	setPasswordResetToken,
	updateDoctorVerification,
	verifyToken,
} from "../Controllers/AdminController";
import { isAuth } from "../Utils/Auth";

const router = Router();

router.get("/getAllDoctors", isAuth, getAllDoctors);

router.put(
	"/updateDoctorVerification/:userId",
	isAuth,
	updateDoctorVerification
);

router.post("/setPasswordResetToken", setPasswordResetToken);

router.post("/verifyToken", verifyToken);

export default router;
