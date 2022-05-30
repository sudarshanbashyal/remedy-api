import { Request, Response } from "express";
import { serverError } from ".";
import { trainModel } from "../Utils/LanguageProcessing";
import stringSimilarity from "string-similarity";
import { symptomList, SymptomListType } from "../Utils/Symptoms";
import specializedHospitals from "../Utils/SpecializedHospitals";
import {
	DIAGNOSIS_TYPE,
	ISSUE_TYPE,
	requestMedicAPI,
	SYMPTOM_TYPE,
} from "../Utils/APIMedic";

let nlp: any;

const getNlp = async () => {
	const trailedNlp = await trainModel();
	nlp = trailedNlp;
};

getNlp();

export const analyzeMessageIntent = async (req: Request, res: Response) => {
	try {
		const { message } = req.body;
		const response = await nlp.process("en", message);

		return res.json({
			ok: true,
			data: response,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const reportSymptomSimilarity = async (req: Request, res: Response) => {
	try {
		const { symptom } = req.body;
		const symptomNames: string[] = symptomList.map(
			(sym: SymptomListType) => sym.Name
		);

		const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(
			symptom,
			symptomNames
		);

		if (bestMatch.rating < 0.5) {
			return res.json({
				ok: false,
				error: {
					message: "Couldnt analyze the symptom.",
				},
			});
		}

		return res.json({
			ok: true,
			data: symptomList[bestMatchIndex],
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getSimilarSymptoms = async (
	req: Request,
	res: Response
): Promise<any> => {
	try {
		const { symptoms, gender, dob } = req.body;

		const proposedData = await requestMedicAPI(SYMPTOM_TYPE, {
			symptoms,
			gender,
			dob,
		});

		if (!Array.isArray(proposedData)) {
			return res.status(400).json({
				ok: false,
				error: { message: "Could not provide similar symptoms" },
			});
		}

		return res.json({
			ok: true,
			data: proposedData,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getDiagnosis = async (
	req: Request,
	res: Response
): Promise<any> => {
	try {
		const { symptoms, gender, dob } = req.body;

		const diagnosis = await requestMedicAPI(DIAGNOSIS_TYPE, {
			symptoms,
			gender,
			dob,
		});

		if (!Array.isArray(diagnosis)) {
			return res.status(400).json({
				ok: false,
				error: { message: "Could not process diagnosis." },
			});
		}

		const { ID, Name, ProfName } = diagnosis[0].Issue;

		// set issue id to request body so that it can be accessed by requestMedicAPI again
		const issueInfo = await requestMedicAPI(ISSUE_TYPE, { issueId: ID });

		if (issueInfo === null) {
			return res.status(400).json({
				ok: false,
				error: { message: "Could not process diagnosis." },
			});
		}

		const { TreatmentDescription } = issueInfo;

		return res.json({
			ok: true,
			data: {
				ID,
				Name,
				ProfName,
				TreatmentDescription,
			},
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getSpecializedHospitals = async (req: Request, res: Response) => {
	try {
		const { keywords } = req.body;

		let specializingHospitals: any[] = [];
		let specializationFound: boolean = false;

		const hospitalCategories = Object.keys(specializedHospitals);
		let stem = "";

		if (Array.isArray(keywords)) {
			for (let keyword of keywords) {
				stem = keyword.stem.trim().toLowerCase();

				if (hospitalCategories.includes(stem)) {
					specializationFound = true;
					specializingHospitals =
						specializedHospitals[
							stem as keyof typeof specializedHospitals
						];

					break;
				}
			}
		}

		if (!specializationFound) {
			return res.status(404).json({
				ok: false,
				error: {
					message: `Sorry. Could not find specialized hospitals.`,
				},
			});
		}

		return res.json({
			ok: true,
			data: {
				specializingHospitals,
				stem,
			},
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};
