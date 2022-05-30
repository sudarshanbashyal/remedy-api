import bcrypt from "bcrypt";

const saltRounds = 10;

export const hashPassword = async (password: string): Promise<string> => {
	const salt = await bcrypt.genSalt(10);
	const hashedPassword: string = await bcrypt.hash(password, salt);

	return hashedPassword;
};

export const isCorrectPassword = async (
	plainPassword: string,
	hashedPassword: string
): Promise<boolean> => {
	const isSame = await bcrypt.compare(plainPassword, hashedPassword);

	return isSame;
};
