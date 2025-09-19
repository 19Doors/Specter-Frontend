"use client"
import { FileUploadButton } from "@/components/FileUploadButton";
import Image from "next/image";
import { uploadFile_newConvo } from "@/lib/action";
import { CloudUpload } from "lucide-react";
import { useState, DragEvent, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import PdfWithBoxes from "@/components/pdfView";
import dynamic from "next/dynamic";
import { LegalDocumentSummary } from "@/lib/models";
import { Separator } from "@/components/ui/separator";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SpecSidebar } from "@/components/sidebar";
import { Accordion, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PdfViewerWithBoxes from "@/components/pdfView";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const MyPdf = dynamic(
	() => import('@/components/pdfView'),
	{ ssr: false }
);

interface FileData {
	base64: string;
	mimeType: string;
	name: string;
}

interface BoundingBox {
	x: number;
	y: number;
	width: number;
	height: number;
	pageNumber: number;
	id?: string;
	label?: string;
	confidence?: number;
	color?: string;
}

export default function Dashboard() {
	const sidebarOpen = true;

	const [files, setFiles] = useState<FileData[]>([]);
	const [summary, setSummary] = useState<LegalDocumentSummary>();
	const [user_id, setUserId] = useState("");
	const {
		data: session,
		isPending,
		error, //error object
		refetch //refetch the session
	} = authClient.useSession()
	const router = useRouter();


	useEffect(() => {
		if (!isPending && !session) {
			router.push("/login");
		}
		if (session) {
			setUserId(session.user.id)
		}
	}, [session, isPending])


	// Helper function to convert file to base64
	const convertFileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					// Remove the data URL prefix to get pure base64
					const base64 = reader.result.split(',')[1];
					resolve(base64);
				} else {
					reject(new Error('Failed to read file as base64'));
				}
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	};

	async function handleDrop(e: DragEvent<HTMLDivElement>) {
		e.preventDefault();
		let cf;
		const droppedFiles = e.dataTransfer.files;

		if (droppedFiles.length > 0) {
			const filePromises = Array.from(droppedFiles).map(async (file) => {
				try {
					const base64 = await convertFileToBase64(file);
					return {
						base64,
						mimeType: file.type,
						name: file.name
					};
				} catch (error) {
					console.error(`Error converting file ${file.name}:`, error);
					return null;
				}
			});

			// Wait for all files to be converted
			const convertedFiles = await Promise.all(filePromises);

			// Filter out any null values (failed conversions)
			const validFiles = convertedFiles.filter((file): file is FileData => file !== null);
			cf = validFiles;

			setFiles((prevFiles) => validFiles);
		}
	}

	async function handleSend() {
		const conversationId = crypto.randomUUID();
		console.log(files)

		const uploadData = {
			user_id: user_id,
			conversation_id: conversationId,
			files: files
		};

		await uploadFile_newConvo(uploadData)
		router.push(`/chat/${conversationId}`)
	}

	return (
		<SidebarProvider defaultOpen={sidebarOpen}>
			<SpecSidebar />
			<div className="w-full h-screen">
				<div className="w-full h-full flex justify-center items-center flex-col space-y-8">
					<div className="text-center w-1/3 space-y-1">
						<h1 className="font-merri text-2xl font-bold">Upload Your Legal Documents</h1>
						<p className="font-merri font-light">Let our AI analyze your contracts, agreements, and legal documents to provide clear, actionable insights </p>
					</div>

					{files.length == 0 && (
						<div
							onDrop={handleDrop}
							onDragOver={(event) => event.preventDefault()}
							className="font-inter text-xs cursor-pointer flex flex-col space-y-2 justify-center items-center rounded-xs border border-color3 w-1/4 h-1/4"
						>
							{/* <p className="italic font-light"> DRAG & DROP ZONE </p> */}
							<CloudUpload size={48} />
							<p className="font-merri">Drag and drop your documents here</p>
							<p className="font-merri"><strong>Supported Format:</strong> PDF</p>
						</div>)
					}
					{
						files.length > 0 && (

							<div className="max-w-1/3 flex flex-col text-center font-inter text-xs font-bold text-bg tracking-tight m-2 gap-4 justify-between">
								<div className="flex flex-col gap-2">
									{files.map((f) => {
										return (
											<div key={f.name} className="flex p-4 gap-2 flex-1 items-center rounded-xs min-w-0 w-full bg-color2">
												<Image src="./adobe_color.svg" alt="pdf" height={16} width={16} />
												<span className="truncate">{f.name}</span>
											</div>
										)
									})}
								</div>

								<div
									onDrop={handleDrop}
									onDragOver={(event) => event.preventDefault()}
									className="w-full h-full font-inter text-xs cursor-pointer flex flex-col space-y-2 justify-center items-center rounded-xs border border-color3 p-4"
								>

									{/* <p className="italic font-light"> DRAG & DROP ZONE </p> */}
									<CloudUpload size={48} />
									<p className="font-merri">Drag and drop your documents here</p>
									<p className="font-merri"><strong>Supported Format:</strong> PDF</p>

								</div>

								<div className="w-full flex justify-center">
									<Button onClick={handleSend} variant="secondary" size="lg" className="font-bold border-2 border-color3 w-1/2 text-color4 font-inter text-xs tracking-tight">Ask Specter</Button>
								</div>
							</div>

						)
					}
					<div>
					</div>
				</div>
			</div>
		</SidebarProvider>
	);

}
