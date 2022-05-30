import { Router } from "express";
import {
	addMedicine,
	getFrequencies,
	getIntake,
	getMedicineDetails,
	getMedicineList,
	updateMedicine,
	updateIntakeStatus,
	getMedicalReference,
	getAllIntakes,
	getPatientFrequencies,
} from "../Controllers/MedicineController";
import { isAuth } from "../Utils/Auth";

const router = Router();

router.post("/addMedicine", isAuth, addMedicine);

router.get("/getMedicineList", isAuth, getMedicineList);

router.get("/getMedicineDetails/:medicineId", isAuth, getMedicineDetails);

router.put("/updateMedicine/:medicineId", isAuth, updateMedicine);

router.get("/getFrequencies", isAuth, getFrequencies);

router.get("/getMedicineList", isAuth, getMedicineList);

router.post("/getIntake", isAuth, getIntake);

router.get("/getAllIntakes/:startDate/:endDate", isAuth, getAllIntakes);

router.put("/updateIntakeStatus/:intakeId", isAuth, updateIntakeStatus);

router.get("/getMedicalReference/:name", getMedicalReference);

router.get("/getPatientFrequencies/:userId", getPatientFrequencies);

export default router;
