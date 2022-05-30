import { Router } from "express";
import {
	registerUser,
	loginUser,
	emailExists,
	fetchUser,
	updateUserProfile,
	getMessageList,
	getChatMessages,
	getChatMedia,
	updateUserAccount,
	getDoctors,
	addMessageRequest,
	getIncomingRequests,
	changeRequestStatus,
	getVoximplantUsername,
	resetPassword,
	ping,
} from "../Controllers/UserController";
import { isAuth } from "../Utils/Auth";

const router = Router();

router.get("/ping", ping);

router.post("/registerUser", registerUser);

router.post("/loginUser", loginUser);

router.post("/checkEmail", emailExists);

router.get("/fetchUser", isAuth, fetchUser);

router.get("/getVoximplantUsername/:id", getVoximplantUsername);

router.put("/updateUserProfile", isAuth, updateUserProfile);

router.put("/updateUserAccount", isAuth, updateUserAccount);

router.get("/getMessageList", isAuth, getMessageList);

router.get("/getChatMessages/:chatId", isAuth, getChatMessages);

router.get("/getChatMedia/:chatId", isAuth, getChatMedia);

router.post("/getDoctors", isAuth, getDoctors);

router.post("/addMessageRequest", isAuth, addMessageRequest);

router.post("/getIncomingRequests", isAuth, getIncomingRequests);

router.put("/changeRequestStatus/:id", isAuth, changeRequestStatus);

router.put("/resetPassword", resetPassword);

export default router;
