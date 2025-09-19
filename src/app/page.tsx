"use client"
import { FileUploadButton } from "@/components/FileUploadButton";
import Image from "next/image";
import { uploadFiles, processDocuments, createSummary, saveSummary } from "@/lib/action";
import { CloudUpload, AlertCircle, X, FileText, Brain, Database, CheckCircle } from "lucide-react";
import { useState, DragEvent, useEffect, useRef } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { gsap } from "gsap";

const MyPdf = dynamic(
	() => import('@/components/pdfView'),
	{ ssr: false }
);

interface FileData {
	base64: string;
	mimeType: string;
	name: string;
	pageCount: number;
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

// Processing steps for loading animation
const PROCESSING_STEPS = [
	{ 
		id: 'uploading', 
		label: 'Uploading Documents', 
		icon: FileText, 
		description: "Securely uploading your legal documents to cloud storage...",
		color: "#3B82F6"
	},
	{ 
		id: 'analyzing', 
		label: 'Analyzing Legal Content', 
		icon: Brain, 
		description: "Our AI is reading and understanding your documents...",
		color: "#8B5CF6"
	},
	{ 
		id: 'summarizing', 
		label: 'Creating Summary', 
		icon: Database, 
		description: "Generating structured legal analysis and risk assessment...",
		color: "#F59E0B"
	},
	{ 
		id: 'complete', 
		label: 'Analysis Complete', 
		icon: CheckCircle, 
		description: "Ready to answer your legal questions!",
		color: "#10B981"
	}
];

export default function Dashboard() {
	const sidebarOpen = true;
	const [files, setFiles] = useState<FileData[]>([]);
	const [summary, setSummary] = useState<LegalDocumentSummary>();
	const [user_id, setUserId] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [pdfjs, setPdfjs] = useState<any>(null);
	const [isClient, setIsClient] = useState(false);
	
	// Processing states
	const [isProcessing, setIsProcessing] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [progress, setProgress] = useState(0);
	const [stepResults, setStepResults] = useState<any[]>([]);

	// GSAP refs
	const processingRef = useRef<HTMLDivElement>(null);
	const iconRef = useRef<HTMLDivElement>(null);
	const progressRingRef = useRef<HTMLDivElement>(null);
	const stepsRef = useRef<HTMLDivElement>(null);

	const {
		data: session,
		isPending,
		error,
		refetch
	} = authClient.useSession()
	const router = useRouter();

	// Handle client-side hydration
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Load react-pdf only on client-side after hydration
	useEffect(() => {
		if (isClient) {
			const loadPdfJs = async () => {
				try {
					const { pdfjs: pdfjsLib } = await import('react-pdf');
					
					// Configure PDF.js worker
					pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
					
					setPdfjs(pdfjsLib);
				} catch (error) {
					console.error('Failed to load PDF.js:', error);
				}
			};
			loadPdfJs();
		}
	}, [isClient]);

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/login");
		}
		if (session) {
			setUserId(session.user.id)
		}
	}, [session, isPending])

	// GSAP Animations
	useEffect(() => {
		if (isProcessing && processingRef.current) {
			// Entrance animation
			gsap.fromTo(processingRef.current, 
				{ opacity: 0, scale: 0.8 }, 
				{ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
			);
		}
	}, [isProcessing]);

	useEffect(() => {
		if (isProcessing && iconRef.current) {
			const currentStepData = PROCESSING_STEPS[currentStep];
			
			// Icon animation
			gsap.to(iconRef.current, {
				scale: 1.1,
				duration: 0.3,
				yoyo: true,
				repeat: 1,
				ease: "power2.inOut"
			});

			// Color transition
			gsap.to(iconRef.current, {
				color: currentStepData.color,
				duration: 0.5,
				ease: "power2.inOut"
			});

			// Rotation for non-final steps
			if (currentStep < PROCESSING_STEPS.length - 1) {
				gsap.to(iconRef.current, {
					rotation: 360,
					duration: 2,
					repeat: -1,
					ease: "none"
				});
			} else {
				gsap.set(iconRef.current, { rotation: 0 });
			}
		}
	}, [currentStep, isProcessing]);

	useEffect(() => {
		if (stepsRef.current) {
			const stepElements = stepsRef.current.children;
			
			gsap.to(stepElements[currentStep], {
				scale: 1.1,
				duration: 0.3,
				ease: "back.out(1.7)"
			});

			// Reset previous steps
			for (let i = 0; i < currentStep; i++) {
				gsap.to(stepElements[i], {
					scale: 1,
					duration: 0.3
				});
			}
		}
	}, [currentStep]);

	// Validate PDF file type
	const isPdfFile = (file: File): boolean => {
		const validMimeTypes = ['application/pdf'];
		const validExtensions = ['.pdf'];
		const fileName = file.name.toLowerCase();
		const extension = fileName.substring(fileName.lastIndexOf('.'));
		return validMimeTypes.includes(file.type) || validExtensions.includes(extension);
	};

	// Accurately count PDF pages using react-pdf (client-side only)
	const countPdfPages = async (arrayBuffer: ArrayBuffer): Promise<number> => {
		if (!pdfjs) {
			throw new Error('PDF.js not loaded yet');
		}
		try {
			const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
			const pdf = await loadingTask.promise;
			return pdf.numPages;
		} catch (error) {
			console.error('Error counting PDF pages:', error);
			throw new Error('Invalid PDF file or corrupted document');
		}
	};

	// Helper function to convert file to base64 with validation
	const convertFileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') {
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

	// Convert file to ArrayBuffer for PDF processing
	const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (reader.result instanceof ArrayBuffer) {
					resolve(reader.result);
				} else {
					reject(new Error('Failed to read file as ArrayBuffer'));
				}
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsArrayBuffer(file);
		});
	};

	// Validate and process files - only return valid files
	const validateAndProcessFiles = async (fileList: FileList): Promise<{ validFiles: FileData[], errorMessages: string[] }> => {
		if (!pdfjs) {
			return { validFiles: [], errorMessages: ['PDF processing library is still loading. Please try again.'] };
		}
		const errorMessages: string[] = [];
		const validFiles: FileData[] = [];
		for (const file of Array.from(fileList)) {
			// Check file type
			if (!isPdfFile(file)) {
				errorMessages.push(`"${file.name}" is not a PDF file. Only PDF files are supported.`);
				continue;
			}
			// Check file size (50MB limit)
			const maxSizeInBytes = 50 * 1024 * 1024;
			if (file.size > maxSizeInBytes) {
				errorMessages.push(`"${file.name}" exceeds the 50MB file size limit.`);
				continue;
			}
			try {
				// Read file as both base64 and ArrayBuffer
				const [base64, arrayBuffer] = await Promise.all([
					convertFileToBase64(file),
					fileToArrayBuffer(file)
				]);
				// Get accurate page count
				const pageCount = await countPdfPages(arrayBuffer);
				// Check page count - only add to validFiles if under 30 pages
				if (pageCount > 30) {
					errorMessages.push(`"${file.name}" has ${pageCount} pages (maximum 30 pages allowed).`);
				} else {
					validFiles.push({
						base64,
						mimeType: file.type,
						name: file.name,
						pageCount
					});
				}
			} catch (error) {
				errorMessages.push(`Failed to process "${file.name}": ${error.message}`);
			}
		}
		return { validFiles, errorMessages };
	};

	// Animate progress updates
	const updateProgress = (newProgress: number) => {
		gsap.to({ value: progress }, {
			value: newProgress,
			duration: 0.5,
			ease: "power2.out",
			onUpdate: function() {
				setProgress(Math.round(this.targets()[0].value));
			}
		});
	};

	// Real step-by-step processing with API calls
	const processDocumentsStepByStep = async (uploadData: any) => {
		setIsProcessing(true);
		setCurrentStep(0);
		setProgress(0);
		setStepResults([]);

		try {
			// Step 1: Upload files to cloud storage
			setCurrentStep(0);
			updateProgress(25);
			const uploadResult = await uploadFiles(uploadData);
			if (!uploadResult?.success) {
				throw new Error('Failed to upload files to cloud storage');
			}
			setStepResults(prev => [...prev, uploadResult]);

			// Step 2: Process documents with DocAI
			setCurrentStep(1);
			updateProgress(50);
			const processResult = await processDocuments(uploadData);
			if (!processResult?.success) {
				throw new Error('Failed to process documents with AI');
			}
			setStepResults(prev => [...prev, processResult]);

			// Step 3: Create structured summary
			setCurrentStep(2);
			updateProgress(75);
			const summaryResult = await createSummary({
				user_id: uploadData.user_id,
				conversation_id: uploadData.conversation_id,
				processed_results: processResult.processed_results
			});
			if (!summaryResult?.success) {
				throw new Error('Failed to create document summary');
			}
			setStepResults(prev => [...prev, summaryResult]);

			// Step 4: Save summary to Firestore
			await saveSummary({
				user_id: uploadData.user_id,
				conversation_id: uploadData.conversation_id,
				summary: summaryResult.summary
			});

			// Step 5: Complete
			setCurrentStep(3);
			updateProgress(100);

			// Final animation
			setTimeout(() => {
				if (iconRef.current) {
					gsap.to(iconRef.current, {
						scale: 1.3,
						duration: 0.5,
						yoyo: true,
						repeat: 1,
						ease: "back.out(1.7)"
					});
				}
			}, 500);

			// Navigate after completion animation
			setTimeout(() => {
				router.push(`/chat/${uploadData.conversation_id}`);
			}, 2000);

		} catch (error) {
			console.error("Processing failed:", error);
			setErrorMessage(`Processing failed: ${error.message}`);
			setIsProcessing(false);
		}
	};

	async function handleDrop(e: DragEvent<HTMLDivElement>) {
		e.preventDefault();
		setIsUploading(true);
		setErrorMessage("");
		const droppedFiles = e.dataTransfer.files;
		if (droppedFiles.length > 0) {
			try {
				const { validFiles, errorMessages } = await validateAndProcessFiles(droppedFiles);
				
				// Add only valid files to the list
				setFiles(prevFiles => [...prevFiles, ...validFiles]);
				
				// Show error message if any files were rejected
				if (errorMessages.length > 0) {
					setErrorMessage(errorMessages.join(' '));
				}
			} catch (error) {
				console.error('File processing error:', error);
				setErrorMessage('An error occurred while processing the files.');
			}
		}
		setIsUploading(false);
	}

	// Remove file from list
	const removeFile = (index: number) => {
		setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
		setErrorMessage(""); // Clear error when user removes files
	};

	async function handleSend() {
		if (files.length === 0) {
			setErrorMessage("Please add at least one valid PDF file.");
			return;
		}

		const conversationId = crypto.randomUUID();
		const uploadData = {
			user_id: user_id,
			conversation_id: conversationId,
			files: files
		};

		// Start real processing with API calls
		await processDocumentsStepByStep(uploadData);
	}

	// Processing Loading Component with GSAP animations
	const ProcessingComponent = () => {
		const currentStepData = PROCESSING_STEPS[currentStep];
		const IconComponent = currentStepData.icon;

		return (
			<div ref={processingRef} className="w-full h-screen flex justify-center items-center flex-col space-y-8">
				<div className="text-center w-1/3 space-y-6">
					{/* Main Icon with Progress Ring */}
					<div className="flex justify-center mb-6">
						<div className="relative">
							{/* Progress Ring */}
							<svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
								<circle
									cx="50"
									cy="50"
									r="40"
									stroke="currentColor"
									strokeWidth="3"
									fill="transparent"
									className="text-gray-300"
								/>
								<circle
									cx="50"
									cy="50"
									r="40"
									stroke="currentColor"
									strokeWidth="3"
									fill="transparent"
									strokeDasharray={`${2 * Math.PI * 40}`}
									strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
									className="text-color4 transition-all duration-500 ease-out"
									strokeLinecap="round"
								/>
							</svg>
							
							{/* Icon in center */}
							<div ref={iconRef} className="absolute inset-0 flex items-center justify-center">
								<IconComponent 
									size={48} 
									className="text-color4 transition-colors duration-500"
									style={{ color: currentStepData.color }}
								/>
							</div>
							
							{/* Progress percentage */}
							<div className="absolute inset-0 flex items-center justify-center mt-16">
								<span className="text-sm font-inter font-bold text-gray-600">
									{progress}%
								</span>
							</div>
						</div>
					</div>
					
					<h1 className="font-merri text-2xl font-bold">{currentStepData.label}</h1>
					<p className="font-merri font-light text-gray-600">
						{currentStepData.description}
					</p>

					{/* Step indicators */}
					<div ref={stepsRef} className="flex justify-center space-x-6 pt-6">
						{PROCESSING_STEPS.map((step, index) => {
							const StepIcon = step.icon;
							const isCompleted = index < currentStep;
							const isCurrent = index === currentStep;
							
							return (
								<div 
									key={step.id}
									className={`flex flex-col items-center space-y-2 transition-all duration-300 ${
										isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'
									}`}
								>
									<div className={`p-3 rounded-full border-2 transition-all duration-300 ${
										isCompleted 
											? 'border-green-500 bg-green-500/10 text-green-500' 
											: isCurrent 
												? 'border-color4 bg-color4/10 text-color4 shadow-lg'
												: 'border-gray-300 text-gray-400'
									}`}>
										{isCompleted ? (
											<CheckCircle size={20} />
										) : (
											<StepIcon size={20} />
										)}
									</div>
									<span className="text-xs font-inter font-medium max-w-16 text-center leading-tight">
										{step.label}
									</span>
								</div>
							);
						})}
					</div>

					{/* File count indicator */}
					{files.length > 0 && (
						<div className="mt-6 text-sm text-gray-500 font-inter">
							Processing {files.length} document{files.length > 1 ? 's' : ''}
						</div>
					)}
				</div>
			</div>
		);
	};

	// Show processing screen when processing
	if (isProcessing) {
		return (
			<SidebarProvider defaultOpen={sidebarOpen}>
				<SpecSidebar />
				<div className="w-full">
					<ProcessingComponent />
				</div>
			</SidebarProvider>
		);
	}

	// Don't render anything until client-side hydration is complete
	if (!isClient) {
		return (
			<SidebarProvider defaultOpen={sidebarOpen}>
				<SpecSidebar />
				<div className="w-full h-screen">
					<div className="w-full h-full flex justify-center items-center flex-col space-y-8">
						<div className="text-center w-1/3 space-y-1">
							<h1 className="font-merri text-2xl font-bold">Upload Your Legal Documents</h1>
							<p className="font-merri font-light">Let our AI analyze your contracts, agreements, and legal documents to provide clear, actionable insights</p>
						</div>
						<div className="font-inter text-xs cursor-pointer flex flex-col space-y-2 justify-center items-center rounded-xs border border-color3 w-1/4 h-1/4">
							<CloudUpload size={48} />
							<p className="font-merri">Loading PDF processor...</p>
						</div>
					</div>
				</div>
			</SidebarProvider>
		);
	}

	// Show skeleton loading only after PDF.js is loading
	if (!pdfjs) {
		return (
			<SidebarProvider defaultOpen={sidebarOpen}>
				<SpecSidebar />
				<div className="w-full h-screen">
					<div className="w-full h-full flex justify-center items-center flex-col space-y-8">
						<div className="text-center w-1/3 space-y-1">
							<Skeleton className="h-8 w-64 mx-auto" />
							<Skeleton className="h-4 w-96 mx-auto" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-4 w-32" />
						</div>
					</div>
				</div>
			</SidebarProvider>
		);
	}

	return (
		<SidebarProvider defaultOpen={sidebarOpen}>
			<SpecSidebar />
			<div className="w-full h-screen">
				<div className="w-full h-full flex justify-center items-center flex-col space-y-8">
					<div className="text-center w-1/3 space-y-1">
						<h1 className="font-merri text-2xl font-bold">Upload Your Legal Documents</h1>
						<p className="font-merri font-light">Let our AI analyze your contracts, agreements, and legal documents to provide clear, actionable insights</p>
					</div>
					{/* Error Message */}
					{errorMessage && (
						<Alert className="w-1/2 border-red-200">
							<AlertCircle className="h-4 w-4 text-red-500" />
							<AlertDescription className="text-red-600 text-sm">
								{errorMessage}
							</AlertDescription>
						</Alert>
					)}
					{/* Loading Skeletons */}
					{isUploading && (
						<div className="w-1/2 space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					)}
					{files.length == 0 && !isUploading && (
						<div
							onDrop={handleDrop}
							onDragOver={(event) => event.preventDefault()}
							className="font-inter text-xs cursor-pointer flex flex-col space-y-2 justify-center items-center rounded-xs border border-color3 w-1/4 h-1/4"
						>
							<CloudUpload size={48} />
							<p className="font-merri">Drag and drop your documents here</p>
							<p className="font-merri"><strong>Supported Format:</strong> PDF</p>
							<p className="font-merri font-bold">Max 30 pages each</p>
						</div>
					)}
					{files.length > 0 && (
						<div className="max-w-1/3 flex flex-col text-center font-inter text-xs font-bold text-bg tracking-tight m-2 gap-4 justify-between">
							<div className="flex flex-col gap-2">
								{files.map((f, index) => (
									<div 
										key={`${f.name}-${index}`} 
										className="flex p-4 gap-2 flex-1 items-center rounded-xs min-w-0 w-full bg-color2"
									>
										<Image src="./adobe_color.svg" alt="pdf" height={16} width={16} />
										<div className="flex-1 text-left">
											<span className="truncate block">{f.name}</span>
											<span className="text-xs text-gray-600 block">
												{f.pageCount} pages
											</span>
										</div>
										<Button
											onClick={() => removeFile(index)}
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
							<div
								onDrop={handleDrop}
								onDragOver={(event) => event.preventDefault()}
								className="w-full h-full font-inter text-xs cursor-pointer flex flex-col space-y-2 justify-center items-center rounded-xs border border-color3 p-4"
							>
								<CloudUpload size={48} />
								<p className="font-merri">Drag and drop your documents here</p>
								<p className="font-merri"><strong>Supported Format:</strong> PDF</p>
								<p className="font-merri font-bold">Max 30 pages each</p>
							</div>
							<div className="w-full flex justify-center">
								<Button 
									onClick={handleSend} 
									variant="secondary" 
									size="lg" 
									className="font-bold border-2 border-color3 w-1/2 text-color4 font-inter text-xs tracking-tight"
									disabled={files.length === 0 || isProcessing}
								>
									{isProcessing ? 'Processing...' : 'Ask Specter'}
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</SidebarProvider>
	);
}
