import { Response } from "express";

export const serverError = (e: Error, res: Response) => {
	console.error(e);

	return res.json({
		ok: false,
		error: e,
	});
};
