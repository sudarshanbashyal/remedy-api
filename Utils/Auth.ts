import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, NextFunction, Response } from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import os from "os";

dotenv.config();

export interface AuthRequestType extends Request {
	userId?: string | null;
}

export const generateJWTToken = (userId: string) => {
	if (process.env.JWT_TOKEN_SECRET) {
		return jwt.sign({ userId }, process.env.JWT_TOKEN_SECRET);
	}

	return null;
};

export const isAuth = (
	req: AuthRequestType,
	res: Response,
	next: NextFunction
) => {
	const authorization = req.headers["authorization"];

	if (!authorization) {
		return res.status(401).json({
			ok: false,
			error: {
				message: "Unauthorized access.",
			},
		});
	}

	const authToken = authorization.split(" ")[1];

	if (process.env.JWT_TOKEN_SECRET) {
		const payload: any = jwt.verify(
			authToken,
			process.env.JWT_TOKEN_SECRET
		);

		req.userId = payload.userId;

		next();
	}
};

export const setApiMedicToken = async () => {
	const { API_MEDIC_KEY, API_MEDIC_SECRET, APP_ENV } = process.env;

	const response = await fetch("https://authservice.priaid.ch/login", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${API_MEDIC_KEY}:${API_MEDIC_SECRET}`,
		},
	});

	const { Token } = await response.json();
	process.env["API_MEDIC_TOKEN"] = Token;

	// writing content to the .env file
	// only required for dev environment
	if (APP_ENV!.trim() === "dev") {
		const envFilePath = path.resolve(__dirname, "../.env");
		let envContent = fs.readFileSync(envFilePath, "utf8").split(os.EOL);

		envContent.forEach((env: string, index: number) => {
			const [key] = env.split("=");

			if (key.trim() === "API_MEDIC_TOKEN") {
				envContent[index] = `${key} = "${Token}"`;
				return;
			}
		});

		fs.writeFileSync(envFilePath, envContent.join(os.EOL));
	}
};

export const generateResetToken = (): number => {
	return Math.floor(Math.random() * 90000) + 10000;
};
