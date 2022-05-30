import { PrismaDB } from "..";
import { Socket } from "socket.io";
import { MessageType } from "@prisma/client";
import { MESSAGE_PRESET, uploadImage } from "../Utils/cloudinary";
import { UploadApiResponse } from "cloudinary";

interface ActiveSocketsType {
	[key: string]: string | string[];
}

const activeSockets: ActiveSocketsType = {};

export const addSocket = (id: string, socket: string) => {
	activeSockets[id as keyof ActiveSocketsType] = socket;
	console.log(activeSockets);
};

export const removeSocket = (id: string) => {
	delete activeSockets[id];
	console.log(activeSockets);
};

export const getSocket = (id: keyof ActiveSocketsType) => {
	return activeSockets[id];
};

export const handleMessage = async ({
	authorId,
	content,
	chatId,
	recipentId,
	type,
	socket,
	fileExtension,
	name,
	chatBot,
}: {
	authorId: string;
	content: string;
	chatId: string;
	recipentId: string;
	type: string;
	socket: Socket<any>;
	fileExtension: string | null;
	name: string;
	chatBot: boolean;
}) => {
	try {
		const recipentSocket = getSocket(recipentId);

		let messageContent = content;
		let public_id = "";

		if (type === "File" || type == "Image") {
			const base64DataUri =
				type === "File"
					? `data:${fileExtension};base64,${content}`
					: `data:image/jpeg;base64,${content}`;

			const response: UploadApiResponse | null = await uploadImage(
				base64DataUri,
				MESSAGE_PRESET,
				name
			);
			if (response) {
				messageContent = response!.secure_url;
				public_id = response!.public_id;
			}
		}

		const newMessage = await PrismaDB.message.create({
			data: {
				authorId,
				type: type as MessageType,
				content: messageContent,
				chatId,
				chatBot,
				name: public_id,
			},
			select: {
				authorId: true,
				type: true,
				chatId: true,
				date: true,
				content: true,
				name: true,
				chatBot: true,
			},
		});

		socket.emit("chat_screen_message", newMessage);

		if (recipentSocket) {
			socket.to(recipentSocket).emit("chat_screen_message", newMessage);
			socket.to(recipentSocket).emit("chat_list_message", newMessage);

			/*
			socket.to(recipentSocket).emit("message_notification", newMessage);
			*/
		}
	} catch (error) {
		console.log(error);
	}
};
