"use server"

import { LegalDocumentSummary } from "./models";

interface File {
	base64: string;
	mimeType: string;
	name: string;
}

interface IUploadFilesNewCono {
	user_id: string;
	conversation_id: string;
	files: File[];
}

interface UploadResponse {
	success: boolean;
	results: Array<any>;
	message: string;
}

interface IGetConvIds {
	user_id: string;
}

interface IGetConv {
	user_id: string;
	conversation_id: string;
}

interface IGetFiles {
	user_id: string;
	conversation_id: string;
}

export async function uploadFile_newConvo(q: IUploadFilesNewCono): Promise<LegalDocumentSummary | null> {
	try {
		// console.log("Sending to server")
		// console.log(q.files);
		// const response = await fetch('http://127.0.0.1:8000/summary', {
		// 	method: 'POST',
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify({files:q.files})
		// });
		const response = await fetch('http://127.0.0.1:8000/upload', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(q)
		});

		if (response.ok) {
			return await response.json();
		} else {
			console.error('Upload failed:', response.status, response.statusText);
			return null;
		}
	} catch (error) {
		console.error('Upload error:', error);
		return null;
	}
}

export async function get_conv_ids({ user_id }: IGetConvIds) {
	try {
		const response = await fetch('http://127.0.0.1:8000/get_conversation_ids', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ "user_id": user_id })
		});

		if (response.ok) {
			return await response.json();
		} else {
			console.error('Upload failed:', response.status, response.statusText);
			return null;
		}
	} catch (error) {
		console.error('Upload error:', error);
		return null;
	}
}

export async function get_conversations({ user_id, conversation_id }: IGetConv) {
	try {
		const response = await fetch('http://127.0.0.1:8000/get_conversation', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ "user_id": user_id, "conversation_id": conversation_id })
		});

		if (response.ok) {
			return await response.json();
		} else {
			console.error('Upload failed:', response.status, response.statusText);
			return null;
		}
	} catch (error) {
		console.error('Upload error:', error);
		return null;
	}
}

export async function get_files({ user_id, conversation_id }: IGetFiles) {
	try {
		const response = await fetch('http://127.0.0.1:8000/get_files', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ "user_id": user_id, "conversation_id": conversation_id })
		});

		if (response.ok) {
			return await response.json();
		} else {
			console.error('Upload failed:', response.status, response.statusText);
			return null;
		}
	} catch (error) {
		console.error('Upload error:', error);
		return null;
	}

}
