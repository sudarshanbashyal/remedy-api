import { generateFromEmail } from "unique-username-generator";
import dotenv from "dotenv";

dotenv.config();

export const generateUsername = (email: string): string => {
	return generateFromEmail(email, 5);
};

export const createVoximplantProfile = async (
	name: string,
	username: string
) => {
	const VoximplantApiClient = require("@voximplant/apiclient-nodejs").default;
	const client = new VoximplantApiClient("../Utils/vox-credentials.json");
	client.onReady = async function () {
		try {
			const result = await client.Users.addUser({
				userName: username,
				userDisplayName: name,
				userPassword: process.env.VOXIMPLANT_USER_PASSWORD,
				applicationId: process.env.VOXIMPLANT_APP_ID,
			});
			console.log(result);
		} catch (e) {
			console.log(e);
		}
	};
};
