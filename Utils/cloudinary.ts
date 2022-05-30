import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_KEY,
	api_secret: process.env.CLOUDINARY_SECRET,
});

export const PROFILE_PRESET = "profile_image";
export const MESSAGE_PRESET = "message_image";
export const DOCUMENT_PRESET = "medical_documents";

export type presetType =
	| typeof PROFILE_PRESET
	| typeof MESSAGE_PRESET
	| typeof DOCUMENT_PRESET;

export const uploadImage = async (
	base64: string,
	preset: presetType,
	fileName: string = ""
) => {
	try {
		const payload = {
			public_id: fileName,
			upload_preset: preset,
			use_filename: true,
			unique_filename: false,
			resource_type: "auto",
		};

		if (fileName !== "") {
			payload["public_id"] = fileName;
		}

		const cloudinaryResponse = await cloudinary.uploader.upload(
			base64,
			payload
		);

		if (!cloudinaryResponse) return null;
		return cloudinaryResponse;
	} catch (error) {
		console.log(error);
		return null;
	}
};

export const uploadMedicalDocuments = async (
	imageAssets: any
): Promise<string[]> => {
	const savedLinks: string[] = [];

	for (let asset of imageAssets) {
		try {
			const uploadedImage: UploadApiResponse | null = await uploadImage(
				`data:image/jpeg;base64,${asset.base64}`,
				DOCUMENT_PRESET
			);

			if (uploadedImage) {
				savedLinks.push(uploadedImage.secure_url);
			}
		} catch (error) {
			console.error(error);
		}
	}

	return savedLinks;
};
