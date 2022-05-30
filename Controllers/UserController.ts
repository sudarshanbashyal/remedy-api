import { UserType } from "@prisma/client";
import { UploadApiResponse } from "cloudinary";
import { Request, Response } from "express";
import { serverError } from ".";
import { PrismaDB, createVoximplantProfile } from "..";
import { AuthRequestType, generateJWTToken } from "../Utils/Auth";
import { hashPassword, isCorrectPassword } from "../Utils/Bcrypt";
import {
	PROFILE_PRESET,
	uploadImage,
	uploadMedicalDocuments,
} from "../Utils/cloudinary";
import { generateUsername } from "../Utils/VoximPlantConfig";

export const ping = async (_: Request, res: Response) => {
	try {
		return res.json({
			ok: true,
			message: "Pong",
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const registerUser = async (req: Request, res: Response) => {
	try {
		const {
			firstName,
			lastName,
			email,
			password,
			gender,
			dob,
			expertise,
			medicalDocuments,
		} = req.body;

		let role = "Patient";
		let verified = true;

		if (expertise && medicalDocuments) {
			role = "Doctor";
			verified = false;
		}

		const generatedUsername = generateUsername(email);

		const user = await PrismaDB.user.create({
			data: {
				firstName,
				lastName,
				email,
				password: await hashPassword(password),
				gender,
				voximplantUsername: generatedUsername,
				dob: new Date(dob),
				profilePicture: `https://avatars.dicebear.com/api/initials/${
					firstName[0] + lastName[0]
				}.png`,
				role: role as UserType,
				verified,
			},
			select: {
				userId: true,
			},
		});

		if (!user) {
			return res.status(500).json({
				ok: false,
				error: {
					message: "Couldn't create user.",
				},
			});
		}

		// upload medical documents if it is a doctor
		if (role === "Doctor") {
			const links = await uploadMedicalDocuments(medicalDocuments);
			if (links) {
				await PrismaDB.professionalDetails.create({
					data: {
						expertise,
						userId: user.userId,
						medicalDocuments: links,
					},
				});
			}
		}

		// create voximplantUsername user profile
		await createVoximplantProfile(
			firstName + " " + lastName,
			generatedUsername
		);

		return res.status(201).json({
			ok: true,
			data: user,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const resetPassword = async (req: Request, res: Response) => {
	try {
		const { userId, password } = req.body;

		const updatedUser = await PrismaDB.user.update({
			where: {
				userId,
			},
			data: {
				password: await hashPassword(password),
			},
		});

		if (updatedUser) {
			return res.json({
				ok: true,
			});
		}

		return res.json({
			ok: false,
			error: {
				message: "Could not update password.",
			},
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const loginUser = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;

		const user = await PrismaDB.user.findUnique({
			where: {
				email,
			},
			include: {
				medicines: {
					include: {
						schedules: true,
					},
				},
			},
		});

		if (!user) {
			return res.status(404).json({
				ok: false,
				error: {
					message: "The user doesn't exist",
				},
			});
		}

		if (!(await isCorrectPassword(password, user.password))) {
			return res.status(401).json({
				ok: false,
				error: {
					message: "Invalid Credentials",
				},
			});
		}

		// sign JWT token
		const token = generateJWTToken(user.userId);

		return res.json({
			ok: true,
			data: { ...user, token },
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const emailExists = async (req: Request, res: Response) => {
	try {
		const { email } = req.body;
		const user = await PrismaDB.user.findUnique({
			where: { email },
		});

		if (!user) {
			return res.status(404).json({
				ok: true,
				data: {
					emailExists: false,
				},
			});
		}

		return res.json({
			ok: true,
			data: {
				emailExists: true,
			},
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const fetchUser = async (req: AuthRequestType, res: Response) => {
	try {
		const { userId } = req;

		if (!userId) {
			return res.status(404).json({
				ok: false,
				error: {
					message: "Unauthorized token or the user doesn't exist.",
				},
			});
		}

		const user = await PrismaDB.user.findUnique({
			where: {
				userId,
			},
			include: {
				medicines: {
					include: {
						schedules: true,
					},
				},
			},
		});

		if (!user) {
			return res.status(404).json({
				ok: false,
				error: {
					message: "Unauthorized token or the user doesn't exist.",
				},
			});
		}

		return res.json({
			ok: true,
			data: user,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getVoximplantUsername = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const user = await PrismaDB.user.findUnique({
			where: {
				userId: id as string,
			},
			select: {
				voximplantUsername: true,
			},
		});

		if (!user) {
			return res.status(404).json({
				ok: false,
				error: {
					message: "User not found.",
				},
			});
		}

		return res.json({
			ok: true,
			data: user,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const updateUserProfile = async (
	req: AuthRequestType,
	res: Response
) => {
	try {
		const { userId } = req;
		const { firstName, lastName, bio, dob, profilePicture, gender } =
			req.body.userData;

		let imageLink = null;

		// upload profile picture first
		if (profilePicture) {
			const encodedImage: UploadApiResponse | null = await uploadImage(
				`data:image/jpeg;base64,${profilePicture}`,
				PROFILE_PRESET
			);

			if (encodedImage) {
				imageLink = encodedImage.secure_url;
			}
		}

		// update user profile
		const user = await PrismaDB.user.update({
			where: {
				userId: userId as string,
			},
			data: {
				firstName,
				lastName,
				bio,
				dob,
				gender,
				...(imageLink && { profilePicture: imageLink }),
			},
			select: {
				firstName: true,
				lastName: true,
				bio: true,
				dob: true,
				profilePicture: true,
				gender: true,
			},
		});

		if (!user) {
			return res.status(500).json({
				ok: false,
				error: {
					message: "Couldn't update profile.",
				},
			});
		}

		return res.status(201).json({
			ok: true,
			data: user,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const updateUserAccount = async (
	req: AuthRequestType,
	res: Response
) => {
	try {
		const { userId } = req;
		const { email, password } = req.body.accountData;

		const fieldsToUpdate: { email: string; password?: string } = {
			email,
		};
		if (password) fieldsToUpdate["password"] = await hashPassword(password);

		const user = await PrismaDB.user.update({
			where: {
				userId: userId as string,
			},
			data: fieldsToUpdate,
			select: {
				email: true,
			},
		});

		if (!user) {
			return res.status(500).json({
				ok: false,
				error: {
					message: "Couldn't update user account.",
				},
			});
		}

		return res.status(201).json({
			ok: true,
			data: user,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getMessageList = async (req: AuthRequestType, res: Response) => {
	try {
		const { userId } = req;

		const messageList = await PrismaDB.chat.findMany({
			where: {
				OR: [
					{
						firstUser: userId as string,
					},
					{
						secondUser: userId as string,
					},
				],
			},
			select: {
				chatId: true,
				firstParticipant: {
					select: {
						userId: true,
						profilePicture: true,
						firstName: true,
						lastName: true,
					},
				},
				secondParticipant: {
					select: {
						userId: true,
						profilePicture: true,
						firstName: true,
						lastName: true,
					},
				},
				messages: {
					select: {
						authorId: true,
						date: true,
						content: true,
						type: true,
					},
					orderBy: {
						date: "desc",
					},
					take: 1,
				},
			},
		});

		return res.json({
			ok: true,
			data: messageList,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getChatMessages = async (req: AuthRequestType, res: Response) => {
	try {
		const { chatId } = req.params;

		const messages = await PrismaDB.message.findMany({
			where: {
				AND: [
					{
						chatId: chatId as string,
					},
				],
			},
			select: {
				content: true,
				date: true,
				authorId: true,
				type: true,
				name: true,
				chatBot: true,
			},
			orderBy: {
				date: "desc",
			},
			take: 10,
		});

		return res.json({
			ok: true,
			data: messages,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getChatMedia = async (req: AuthRequestType, res: Response) => {
	try {
		const { chatId } = req.params;

		const chatMedia = await PrismaDB.message.findMany({
			where: {
				AND: [
					{
						chatId: chatId as string,
					},
					{
						NOT: {
							type: {
								equals: "Text",
							},
						},
					},
				],
			},
			select: {
				date: true,
				type: true,
				content: true,
				name: true,
			},
		});

		return res.json({
			ok: true,
			data: chatMedia,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getDoctors = async (req: AuthRequestType, res: Response) => {
	try {
		const { userId } = req;
		const { name } = req.body;

		const [firstName, lastName] = name.split(" ");

		const doctors = await PrismaDB.user.findMany({
			where: {
				AND: [
					{
						role: "Doctor",
					},
					{
						firstName: {
							contains: firstName,
							mode: "insensitive",
						},
					},
					{
						lastName: {
							contains: lastName || "",
							mode: "insensitive",
						},
					},
				],
			},
			select: {
				userId: true,
				firstName: true,
				lastName: true,
				profilePicture: true,
				professionalDetails: true,
			},
		});

		const outgoingRequests = await PrismaDB.request.findMany({
			where: {
				sendingUser: userId as string,
			},
		});

		return res.json({
			ok: true,
			data: {
				doctors,
				requests: outgoingRequests,
			},
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const addMessageRequest = async (
	req: AuthRequestType,
	res: Response
) => {
	try {
		const { userId } = req;
		const { receivingUser } = req.body;

		const request = await PrismaDB.request.create({
			data: {
				sendingUser: userId as string,
				receivingUser: receivingUser as string,
			},
			select: {
				requestId: true,
			},
		});

		return res.status(201).json({
			ok: true,
			data: request,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getIncomingRequests = async (
	req: AuthRequestType,
	res: Response
) => {
	try {
		const { userId } = req;

		const requests = await PrismaDB.request.findMany({
			where: {
				AND: [
					{
						receivingUser: userId as string,
					},
					{
						status: "Pending",
					},
				],
			},
			include: {
				requestFrom: {
					select: {
						userId: true,
						firstName: true,
						lastName: true,
						profilePicture: true,
					},
				},
			},
		});

		return res.json({
			ok: true,
			data: requests,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const changeRequestStatus = async (
	req: AuthRequestType,
	res: Response
) => {
	try {
		const { userId } = req;
		const { id } = req.params;
		const { status } = req.body;

		const updatedRequest = await PrismaDB.request.update({
			where: {
				requestId: id as string,
			},
			data: {
				status,
			},
			select: {
				sendingUser: true,
				requestId: true,
				status: true,
			},
		});

		// if the request was accepted, create a new chat
		if (status === "Accepted") {
			await PrismaDB.chat.create({
				data: {
					firstUser: userId as string,
					secondUser: updatedRequest.sendingUser,
				},
			});
		}

		return res.status(201).json({
			ok: true,
			data: updatedRequest,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};
