import { MailData } from "@sendgrid/helpers/classes/mail";
import sendGrid, { MailDataRequired, ResponseError } from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const {
	SENDGRID_API_KEY,
	SENDGRID_VERIFICATION_TEMPLATE_ID,
	SENDGRID_PW_RESET_TEMPLATE_ID,
	SENDGRID_SENDER_EMAIL,
} = process.env;

if (SENDGRID_API_KEY) {
	sendGrid.setApiKey(SENDGRID_API_KEY);
}

//
export const SUBJECT_VERIFICATION = "SUBJECT_VERIFICATION";
export const SUBJECT_PASSWORD_RESET = "SUBJECT_PASSWORD_RESET";

export type EmailSubjectType =
	| typeof SUBJECT_VERIFICATION
	| typeof SUBJECT_PASSWORD_RESET;

export type EmailDataType = {
	SUBJECT_VERIFICATION: {
		first_name: string;
		last_name: string;
		email: string;
	};
	SUBJECT_PASSWORD_RESET: {
		first_name: string;
		last_name: string;
		email: string;
		token: number;
	};
};
type EmailName = keyof EmailDataType;

export const sendEmail = async <T extends EmailName>(
	subject: T,
	data: EmailDataType[T]
) => {
	try {
		const mailDetails: MailData = {
			to: data.email,
			from: SENDGRID_SENDER_EMAIL || "",
			templateId:
				subject === SUBJECT_PASSWORD_RESET
					? SENDGRID_PW_RESET_TEMPLATE_ID
					: SENDGRID_VERIFICATION_TEMPLATE_ID,
			subject:
				subject === SUBJECT_VERIFICATION
					? "Password Reset"
					: "Account Verification",
			dynamicTemplateData: data,
		};

		const mailResponse = await sendGrid.send(
			mailDetails as MailDataRequired
		);
		console.log(mailResponse);
	} catch (error) {
		console.error(error);
	}
};

const sendVerificationEmail = async (
	email: string,
	firstName: string,
	lastName: string
) => {
	try {
		const msg: MailData = {
			to: email,
			from: SENDGRID_SENDER_EMAIL || "",
			templateId: SENDGRID_VERIFICATION_TEMPLATE_ID,
			subject: SUBJECT_VERIFICATION,
			dynamicTemplateData: {
				first_name: firstName,
				last_name: lastName,
			},
		};

		const mailResponse = await sendGrid.send(msg as MailDataRequired);
		console.log(mailResponse);
	} catch (error) {
		let err = error as ResponseError;

		console.log(err.response.body);
	}
};
