import { Router } from "express";
import {
	analyzeMessageIntent,
	getDiagnosis,
	getSimilarSymptoms,
	getSpecializedHospitals,
	reportSymptomSimilarity,
} from "../Controllers/ChatBotController";

const router = Router();

router.post("/analyzeMessageIntent", analyzeMessageIntent);

router.post("/reportSymptomSimilarity", reportSymptomSimilarity);

router.post("/getSimilarSymptoms", getSimilarSymptoms);

router.post("/getDiagnosis", getDiagnosis);

router.post("/getSpecializedHospitals", getSpecializedHospitals);

export default router;
