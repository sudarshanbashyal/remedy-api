import dotenv from "dotenv";
import { setApiMedicToken } from "./Auth";
import fetch from "node-fetch";

dotenv.config();

export const SYMPTOM_TYPE = "SYMPTOM";
export const DIAGNOSIS_TYPE = "DIAGNOSIS";
export const ISSUE_TYPE = "ISSUE_INFO";

type APIMedicRequestType =
	| typeof SYMPTOM_TYPE
	| typeof DIAGNOSIS_TYPE
	| typeof ISSUE_TYPE;

export interface ApiMedicRequestBody {
	symptoms?: string[];
	gender?: string;
	dob?: string;
	issueId?: number;
}

const baseURL = "https://healthservice.priaid.ch";

const formRequestQuery = async (
	apiURL: string,
	...queryParams: string[]
): Promise<any> => {
	try {
		const { API_MEDIC_TOKEN } = process.env;
		const hostname = baseURL + apiURL;
		const tokenParam = `token=${API_MEDIC_TOKEN}&`;
		const languageQuery = `language=en-gb&`;
		const formatQuery = `format=json`;

		const fullURL =
			hostname +
			tokenParam +
			languageQuery +
			queryParams.join("") +
			formatQuery;

		const response = await fetch(fullURL);
		const data = await response.json();

		return data;
	} catch (error) {
		console.log(error);
		return null;
	}
};

export const requestMedicAPI = async (
	type: APIMedicRequestType,
	req: ApiMedicRequestBody
): Promise<any> => {
	try {
		let apiPath: string;
		const additionalParams: string[] = [];

		if (type === ISSUE_TYPE) {
			const { issueId } = req;
			apiPath = `/issues/${issueId}/info?`;
		} else {
			apiPath =
				type === SYMPTOM_TYPE ? "/symptoms/proposed?" : "/diagnosis?";
			const { symptoms, gender, dob } = req;

			const symptomsQuery = `symptoms=[${symptoms!.toString()}]&`;
			const genderQuery = `gender=${
				gender === "Other" ? "Male" : gender
			}&`;
			const dobQuery = `year_of_birth=${dob}&`;

			additionalParams.push(symptomsQuery, genderQuery, dobQuery);
		}

		const data = await formRequestQuery(apiPath, ...additionalParams);

		if (data === "Invalid token") {
			await setApiMedicToken();
			return await requestMedicAPI(type, req);
		}

		return data;
	} catch (error) {
		return null;
	}
};
