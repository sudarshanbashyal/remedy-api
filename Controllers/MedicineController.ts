import { Request, Response } from "express";
import { serverError } from ".";
import { PrismaDB } from "..";
import { AuthRequestType } from "../Utils/Auth";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

export const addMedicine = async (req: AuthRequestType, res: Response) => {
	try {
		const { userId } = req;
		const { name, description, days, schedules, isActive } = req.body;

		const medicine = await PrismaDB.medicine.create({
			data: {
				name,
				description,
				days,
				userId: userId as string,
				active: isActive,
			},
		});
		if (!medicine) {
			return res.status(500).json({
				ok: false,
				error: {
					message: "Couldn't store medicine data.",
				},
			});
		}

		const { medicineId } = medicine;
		const allSchedules = schedules.map((schedule: any) => {
			const minutes = +schedule.minutes;
			let hour = +schedule.hour;

			if (hour == 12) {
				hour = schedule.half === "PM" ? hour : hour + 12;
			} else {
				hour = schedule.half === "AM" ? hour : hour + 12;
			}

			return {
				hour,
				minutes,
				medicineId,
			};
		});

		// save schedules with the medicine id
		const savedScheules = await PrismaDB.schedule.createMany({
			data: allSchedules,
		});

		if (!savedScheules) {
			return res.status(500).json({
				ok: false,
				error: {
					message: "Couldn't store medicine data.",
				},
			});
		}

		// save frequencies with the medicine id
		await PrismaDB.frequency.create({
			data: {
				medicineId,
				frequencyPerWeek: schedules.length * days.length,
				days: days,
			},
		});

		// final medicine with all the schedules
		const finalMedicineDetails = await PrismaDB.medicine.findUnique({
			where: {
				medicineId,
			},
			include: {
				schedules: true,
			},
		});

		return res.status(201).json({
			ok: true,
			data: finalMedicineDetails,
			message: "Medicine Schedule Saved.",
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getMedicineList = async (req: AuthRequestType, res: Response) => {
	try {
		const { userId } = req;

		const medicineDetails = await PrismaDB.medicine.findMany({
			where: {
				userId: userId as string,
			},
			include: {
				schedules: true,
				frequencies: {
					orderBy: {
						date: "desc",
					},
					take: 1,
				},
			},
		});

		return res.json({
			ok: true,
			data: medicineDetails,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getMedicineDetails = async (
	req: AuthRequestType,
	res: Response
) => {
	try {
		const { userId } = req;
		const { medicineId } = req.params;

		const medicine = await PrismaDB.medicine.findFirst({
			where: {
				medicineId,
				userId: userId as string,
			},
			include: {
				schedules: true,
			},
		});

		if (!medicine) {
			return res.status(404).json({
				ok: false,
				error: {
					message: "No medicine with the given id found.",
				},
			});
		}

		return res.json({
			ok: true,
			data: medicine,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const updateMedicine = async (req: AuthRequestType, res: Response) => {
	try {
		const { medicineId } = req.params;
		const { name, description, days, schedules, isActive } = req.body;

		await PrismaDB.medicine.update({
			where: {
				medicineId: medicineId as string,
			},
			data: {
				name,
				description,
				days,
				active: isActive,
			},
		});

		// delete previous schedules and intakes first before updating this medicine
		await PrismaDB.intake.deleteMany({
			where: {
				schedule: {
					medicineId: medicineId as string,
				},
			},
		});

		await PrismaDB.schedule.deleteMany({
			where: {
				medicineId: medicineId as string,
			},
		});

		const allSchedules = schedules.map((schedule: any) => {
			const minutes = +schedule.minutes;
			let hour = +schedule.hour;

			if (hour == 12) {
				hour = schedule.half === "PM" ? hour : hour + 12;
			} else {
				hour = schedule.half === "AM" ? hour : hour + 12;
			}

			return {
				hour,
				minutes,
				medicineId,
			};
		});

		// save schedules with the medicine id
		const savedScheules = await PrismaDB.schedule.createMany({
			data: allSchedules,
		});

		if (!savedScheules) {
			return res.status(500).json({
				ok: false,
				error: {
					message: "Couldn't store medicine data.",
				},
			});
		}

		// check if frequencies are different and save them if need be
		const currentFrequency = await PrismaDB.frequency.findFirst({
			where: {
				medicineId,
			},
			orderBy: {
				date: "desc",
			},
			take: 1,
		});

		const currentFrequencyDays = currentFrequency?.days.sort().join(",");
		const newFrequencyDays = days.sort().join(",");

		// checking old frequency vs new frequency
		if (
			currentFrequency?.frequencyPerWeek !==
				schedules.length * days.length ||
			currentFrequencyDays !== newFrequencyDays
		) {
			await PrismaDB.frequency.create({
				data: {
					medicineId: medicineId as string,
					frequencyPerWeek: schedules.length * days.length,
					days: days,
				},
			});
		}

		// final medicine with all the schedules
		const finalMedicineDetails = await PrismaDB.medicine.findUnique({
			where: {
				medicineId: medicineId as string,
			},
			include: {
				schedules: true,
			},
		});

		return res.status(201).json({
			ok: true,
			data: finalMedicineDetails,
			message: "Medicine Schedule Saved.",
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getFrequencies = async (req: AuthRequestType, res: Response) => {
	try {
		const { userId } = req;

		const frequencies = await PrismaDB.medicine.findMany({
			where: {
				userId: userId as string,
			},
			select: {
				name: true,
				medicineId: true,
				frequencies: {
					select: {
						frequencyId: true,
						date: true,
						frequencyPerWeek: true,
					},
				},
			},
		});

		return res.json({
			ok: true,
			data: frequencies,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getIntake = async (req: AuthRequestType, res: Response) => {
	try {
		const { date, schedules } = req.body;

		const intakeEntries = [];

		for (let schedule of schedules) {
			const entry = await PrismaDB.intake.findFirst({
				where: {
					scheduleId: schedule as string,
					date: date as string,
				},
				select: {
					intakeId: true,
					status: true,
					intakeTime: true,
					schedule: {
						select: {
							hour: true,
							minutes: true,
							scheduleId: true,
							medicine: {
								select: {
									medicineId: true,
									name: true,
								},
							},
						},
					},
				},
			});

			if (entry) {
				intakeEntries.push(entry);
				continue;
			}

			// create a new entry for the schedule/day if none found
			const newEntry = await PrismaDB.intake.create({
				data: {
					date: date as string,
					scheduleId: schedule as string,
				},
				select: {
					intakeId: true,
					status: true,
					scheduleId: true,
					intakeTime: true,
					schedule: {
						select: {
							hour: true,
							minutes: true,
							scheduleId: true,
							medicine: {
								select: {
									medicineId: true,
									name: true,
								},
							},
						},
					},
				},
			});

			if (newEntry) {
				intakeEntries.push(newEntry);
			}
		}

		return res.json({
			ok: true,
			data: intakeEntries,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getAllIntakes = async (req: AuthRequestType, res: Response) => {
	try {
		const { userId } = req;
		const { startDate, endDate } = req.params;

		const monthlyIntakes = await PrismaDB.intake.findMany({
			where: {
				AND: [
					{
						schedule: {
							medicine: {
								userId: userId as string,
							},
						},
					},
					{
						date: {
							gte: startDate,
							lte: endDate,
						},
					},
				],
			},
		});

		return res.json({
			ok: true,
			data: monthlyIntakes,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const updateIntakeStatus = async (
	req: AuthRequestType,
	res: Response
) => {
	try {
		const { intakeId } = req.params;
		let { intakeStatus, intakeTime } = req.body;

		if (
			intakeStatus.toLowerCase() === "skipped" ||
			intakeStatus.toLowerCase() === "unlisted"
		) {
			intakeTime = undefined;
		}

		const updatedEntry = await PrismaDB.intake.update({
			where: {
				intakeId: intakeId as string,
			},
			data: {
				status: intakeStatus,
				intakeTime: intakeTime,
			},
			select: {
				status: true,
				intakeTime: true,
			},
		});

		return res.json({
			ok: true,
			data: updatedEntry,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getMedicalReference = async (req: Request, res: Response) => {
	try {
		const { name } = req.params;

		const { OPEN_FDA_URI } = process.env;
		const fullURI = `${OPEN_FDA_URI}"${name}"`;
		const response = await fetch(fullURI);
		const data = await response.json();

		if (data.error) {
			console.log(data.error);
			return res.status(404).json({
				ok: false,
				error: {
					message: "No data found.",
				},
			});
		}

		return res.json({
			ok: true,
			data: data.results,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};

export const getPatientFrequencies = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;

		const frequencies = await PrismaDB.medicine.findMany({
			where: {
				userId: userId as string,
			},
			select: {
				name: true,
				medicineId: true,
				frequencies: {
					select: {
						frequencyId: true,
						date: true,
						frequencyPerWeek: true,
						days: true,
						medicine: {
							select: {
								medicineId: true,
								name: true,
							},
						},
					},
				},
			},
		});

		return res.json({
			ok: true,
			data: frequencies,
		});
	} catch (error) {
		return serverError(error as Error, res);
	}
};
