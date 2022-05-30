import { Request, Response } from "express";
import { serverError } from ".";
import { PrismaDB } from "..";
import { AuthRequestType, generateResetToken } from "../Utils/Auth";
import {
	sendEmail,
	SUBJECT_PASSWORD_RESET,
	SUBJECT_VERIFICATION,
} from "../Utils/SendGrid";

export const getAllDoctors = async (req: AuthRequestType, res: Response) => {
	try {
		const doctors = await PrismaDB.user.findMany({
			where: {
				role: "Doctor",
			},
			select: {
				userId: true,
				bio: true,
				firstName: true,
				lastName: true,
				email: true,
				verified: true,
				profilePicture: true,
				createdAt: true,
				professionalDetails: true,
			},
		});

		return res.json({
			ok: true,
			data: doctors,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const updateDoctorVerification = async (
	req: AuthRequestType,
	res: Response
) => {
	try {
		const { userId } = req.params;
		const { verification } = req.body;

		const updatedUser = await PrismaDB.user.update({
			where: {
				userId,
			},
			data: {
				verified: verification,
			},
		});

		if (updatedUser.verified) {
			const { email, firstName, lastName } = updatedUser;
			await sendEmail(SUBJECT_VERIFICATION, {
				first_name: firstName,
				last_name: lastName,
				email,
			});
		}

		return res.json({
			ok: true,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const setPasswordResetToken = async (req: Request, res: Response) => {
	try {
		const { email } = req.body;
		const resetToken = generateResetToken();

		const updatedUser = await PrismaDB.user.update({
			where: {
				email,
			},
			data: {
				resetToken,
			},
		});

		if (updatedUser) {
			const { email, firstName, lastName } = updatedUser;
			await sendEmail(SUBJECT_PASSWORD_RESET, {
				first_name: firstName,
				last_name: lastName,
				email,
				token: resetToken,
			});

			return res.status(201).json({
				ok: true,
			});
		}

		return res.status(404).json({
			ok: false,
			error: {
				message: "No user found.",
			},
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const verifyToken = async (req: Request, res: Response) => {
	try {
		const { token, email } = req.body;

		const user = await PrismaDB.user.findFirst({
			where: {
				AND: [
					{
						email: email,
					},
					{
						resetToken: +token,
					},
				],
			},
		});

		if (!user) {
			return res.status(404).json({
				ok: false,
				error: {
					message: "Invalid token.",
				},
			});
		}

		return res.json({
			ok: true,
			data: {
				userId: user.userId,
			},
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};
