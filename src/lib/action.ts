"use server"
import { LegalDocumentSummary } from "./models";

// Base URL for API calls
// const API_BASE_URL = 'http://127.0.0.1:8000';
const API_BASE_URL = 'https://specterbackend-817780240534.asia-southeast1.run.app';

// Interfaces
interface File {
	base64: string;
	mimeType: string;
	name: string;
}

interface IUploadFilesNewConvo {
	user_id: string;
	conversation_id: string;
	files: File[];
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

interface IProcessDocuments {
	user_id: string;
	conversation_id: string;
	files: File[];
}

interface ICreateSummary {
	user_id: string;
	conversation_id: string;
	processed_results: any;
}

interface IEmbedDocuments {
	user_id: string;
	conversation_id: string;
	processed_results: any[];
}

interface IStoreEmbeddings {
	user_id: string;
	conversation_id: string;
	embedded_chunks: any[];
}

interface ISaveSummary {
	user_id: string;
	conversation_id: string;
	summary: any;
}

interface ILLMCall {
	query: Array<{
		type: "text" | "file";
		text?: string;
		base64?: string;
		mime_type?: string;
	}>;
}

// Response Interfaces
interface UploadResponse {
	success: boolean;
	results: Array<any>;
	message: string;
}

interface ProcessResponse {
	success: boolean;
	processed_results: any;
	message: string;
}

interface SummaryResponse {
	success: boolean;
	summary: any;
	message: string;
}

interface EmbedResponse {
	success: boolean;
	embedded_chunks: any[];
	message: string;
}

interface StoreResponse {
	success: boolean;
	table: any;
	message: string;
}

// Helper function for API calls
async function makeAPICall<T>(endpoint: string, data: any): Promise<T | null> {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		if (response.ok) {
			return await response.json();
		} else {
			console.error(`API call to ${endpoint} failed:`, response.status, response.statusText);
			return null;
		}
	} catch (error) {
		console.error(`API call to ${endpoint} error:`, error);
		return null;
	}
}

// Individual Step Functions

/**
 * Step 1: Upload files to cloud storage
 */
export async function uploadFiles(q: IUploadFilesNewConvo): Promise<UploadResponse | null> {
	return makeAPICall<UploadResponse>('/upload_files', q);
}

/**
 * Step 2: Process documents with Google Document AI
 */
export async function processDocuments(q: IProcessDocuments): Promise<ProcessResponse | null> {
	return makeAPICall<ProcessResponse>('/process_documents', q);
}

/**
 * Step 3: Create structured summary from processed documents
 */
export async function createSummary(q: ICreateSummary): Promise<SummaryResponse | null> {
	return makeAPICall<SummaryResponse>('/create_summary', q);
}

/**
 * Step 4: Create embeddings for document chunks
 */
export async function embedDocuments(q: IEmbedDocuments): Promise<EmbedResponse | null> {
	return makeAPICall<EmbedResponse>('/embed_documents', q);
}

/**
 * Step 5: Store embeddings in BigQuery
 */
export async function storeEmbeddings(q: IStoreEmbeddings): Promise<StoreResponse | null> {
	return makeAPICall<StoreResponse>('/store_embeddings', q);
}

/**
 * Step 6: Save summary to Firestore
 */
export async function saveSummary(q: ISaveSummary): Promise<any> {
	return makeAPICall('/save_summary', q);
}

/**
 * Complete workflow: All steps in one call
 */
export async function uploadFile_newConvo(q: IUploadFilesNewConvo): Promise<any> {
	return makeAPICall('/process_complete_workflow', q);
}

/**
 * Alternative: Step-by-step workflow with progress tracking
 */
export async function uploadFileStepByStep(
	q: IUploadFilesNewConvo,
	onProgress?: (step: string, progress: number) => void
): Promise<any> {
	try {
		// Step 1: Upload files
		onProgress?.('Uploading files to cloud storage', 16);
		const uploadResult = await uploadFiles(q);
		if (!uploadResult?.success) {
			throw new Error('Failed to upload files');
		}

		// Step 2: Process documents
		onProgress?.('Processing documents with AI', 33);
		const processResult = await processDocuments(q);
		if (!processResult?.success) {
			throw new Error('Failed to process documents');
		}

		// Step 3: Create summary
		onProgress?.('Creating legal document summary', 66);
		const summaryResult = await createSummary({
			user_id: q.user_id,
			conversation_id: q.conversation_id,
			processed_results: processResult.processed_results
		});
		if (!summaryResult?.success) {
			throw new Error('Failed to create summary');
		}

		// Step 4: Save summary (optional - can be done in parallel)
		onProgress?.('Saving analysis results', 83);
		await saveSummary({
			user_id: q.user_id,
			conversation_id: q.conversation_id,
			summary: summaryResult.summary
		});

		// Step 5: Create embeddings (commented out as in original)
		// onProgress?.('Creating document embeddings', 90);
		// const embedResult = await embedDocuments({
		//     user_id: q.user_id,
		//     conversation_id: q.conversation_id,
		//     processed_results: [processResult.processed_results]
		// });

		// Step 6: Store embeddings (commented out as in original)
		// onProgress?.('Storing embeddings', 95);
		// if (embedResult?.success) {
		//     await storeEmbeddings({
		//         user_id: q.user_id,
		//         conversation_id: q.conversation_id,
		//         embedded_chunks: embedResult.embedded_chunks
		//     });
		// }

		onProgress?.('Complete', 100);

		return {
			success: true,
			upload_results: uploadResult.results,
			processed_results: processResult.processed_results,
			summary: summaryResult.summary,
			message: 'Document analysis completed successfully'
		};

	} catch (error) {
		console.error('Step-by-step workflow error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// LLM Communication Functions

/**
 * Generic LLM call for chat functionality
 */
export async function callLLM(q: ILLMCall): Promise<any> {
	return makeAPICall('/llmcall', q);
}

/**
 * Chat with documents using LLM
 */
export async function chatWithDocuments(
	message: string,
	files?: File[]
): Promise<any> {
	const query = [
		{ type: "text" as const, text: message }
	];

	if (files && files.length > 0) {
		files.forEach(file => {
			query.push({
				type: "file" as const,
				base64: file.base64,
				mime_type: file.mimeType
			});
		});
	}

	return callLLM({ query });
}

// Data Retrieval Functions

/**
 * Get all conversation IDs for a user
 */
export async function get_conv_ids({ user_id }: IGetConvIds): Promise<any> {
	return makeAPICall('/get_conversation_ids', { user_id });
}

/**
 * Get specific conversation data
 */
export async function get_conversations({ user_id, conversation_id }: IGetConv): Promise<any> {
	return makeAPICall('/get_conversation', { user_id, conversation_id });
}

/**
 * Get files for a specific conversation
 */
export async function get_files({ user_id, conversation_id }: IGetFiles): Promise<any> {
	return makeAPICall('/get_files', { user_id, conversation_id });
}

// Health Check
export async function checkAPIHealth(): Promise<any> {
	try {
		const response = await fetch(`${API_BASE_URL}/health`);
		return response.ok ? await response.json() : null;
	} catch (error) {
		console.error('Health check error:', error);
		return null;
	}
}
