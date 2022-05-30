import Express, { json } from "express";
import cors from "cors";
import UserRouter from "./Routes/UserRoute";
import MedicineRouter from "./Routes/MedicineRoute";
import ChatBotRouter from "./Routes/ChatBotRoute";
import AdminRouter from "./Routes/AdminRoute";
import { PrismaClient } from "@prisma/client";
import { createServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { addSocket, handleMessage, removeSocket } from "./Socket/hub";

export const PrismaDB = new PrismaClient();

export const createVoximplantProfile = async (
	name: string,
	username: string
) => {
	const VoximplantApiClient = require("@voximplant/apiclient-nodejs").default;
	const client = new VoximplantApiClient("./Utils/vox-credentials.json");
	client.onReady = async function () {
		try {
			const result = await client.Users.addUser({
				userName: username,
				userDisplayName: name,
				userPassword: process.env.VOXIMPLANT_USER_PASSWORD,
				applicationId: process.env.VOXIMPLANT_APP_ID,
			});
			console.log(result);
		} catch (e) {
			console.log(e);
		}
	};
};

const init = async () => {
	const app = Express();
	app.use(
		json({
			limit: "50mb",
		}),
		cors()
	);

	app.use([UserRouter, MedicineRouter, ChatBotRouter, AdminRouter]);

	// ws server config
	const server = createServer(app);
	const wss = new SocketServer(server, {
		maxHttpBufferSize: 1e9,
	});

	wss.on("connection", (socket: Socket<any>) => {
		const socketId = socket.id;

		socket.on("register_socket", (userId: string) => {
			addSocket(userId, socketId);
		});

		socket.on("unregister_socket", (userId: string) => {
			removeSocket(userId);
		});

		socket.on(
			"handle_message",
			({
				authorId,
				content,
				chatId,
				recipentId,
				type,
				fileExtension,
				chatBot,
				name,
			}: any) => {
				handleMessage({
					authorId,
					content,
					chatId,
					recipentId,
					socket,
					type,
					fileExtension,
					name,
					chatBot,
				});
			}
		);

		socket.on("socketDisconnect", () => {
			console.log("socket disconnected");
		});
	});

	server.listen(process.env.port || 3000, () => {
		console.log("Up and up");
	});
};

init();
