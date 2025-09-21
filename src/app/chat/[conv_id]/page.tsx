"use client"
import Image from "next/image";
import TextareaAutosize from 'react-textarea-autosize';
import { useState, useRef, useEffect, useTransition } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Separator } from "@/components/ui/separator";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SpecSidebar } from "@/components/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	AlertTriangle,
	CheckCircle,
	Shield,
	Download,
	FileText,
	DollarSign,
	Calendar,
	Scale,
	Clock,
	Loader2,
	Plus,
	MessageCircle,
	X,
	Send
} from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { get_conversations, get_files, callLLM } from "@/lib/action";
import React from "react";
import { LegalDocumentSummary } from "@/lib/models";
import dynamic from "next/dynamic";
import ChatMessage from "@/components/ChatMessage";

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

interface RiskItem {
	title: string;
	severity: string;
	description: string;
	why_risky: string;
	source_citation: {
		page_number: number;
		bounding_box: {
			x: number;
			y: number;
			width: number;
			height: number;
		};
	};
}

interface TextContent {
	type: "text";
	text: string;
}

interface FileContent {
	type: "file";
	base64: string;
	mime_type: string;
}

type ContentItem = TextContent | FileContent;

interface Message {
	id: string;
	role: 'user' | 'assistant';
	content: ContentItem[] | string;
	timestamp: Date;
}

const MyPdf = dynamic(
	() => import('@/components/pdfView'),
	{ ssr: false }
);

// All your existing section components (SummaryHighlights, RiskAssessment, etc.) remain the same
const SummaryHighlights = ({ summary }: { summary: LegalDocumentSummary }) => {
	return (
		<div className="flex flex-col gap-4 w-full ">
			<div className="w-full flex flex-col gap-2">
				<h2 className="text-lg font-bold">Summary Highlights</h2>
			</div>
			<div className="grid grid-cols-3 overflow-y-auto gap-4">
				{summary.summary_highlights.map((highlight) => (
					<div key={highlight.text} className={`rounded-xs flex-shrink-0 py-2 px-4 border-1 border-t-3 ${highlight.type == 'positive' ? 'border-t-[#9ED666]' : highlight.type == 'warning' ? 'border-t-[#E7B973]' : 'border-t-color3'}`}>
						<p className="font-inter text-xs tracking-tight">{highlight.text}</p>
					</div>
				))}
			</div>
		</div>
	)
}

const RiskAssessment = ({ summary }: { summary: LegalDocumentSummary }) => {
	return (
		<div className="flex flex-col gap-4 w-full">
			<div className="w-full flex flex-col gap-2">
				<h2 className="text-lg font-bold">Risk Assessment</h2>
				<div className="font-inter tracking-tight text-sm w-full flex space-y-2 items-center">
					<Progress value={summary.risk_assessment.overall_risk_score * 10} className="border border-color3" />
				</div>
				<p className="text-sm font-inter tracking-tight">{summary.risk_assessment.risk_summary}</p>
			</div>
			<div>
				<Table className="table-fixed w-full">
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px] font-bold">Severity</TableHead>
							<TableHead className="w-[200px] font-bold">Title</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{summary.risk_assessment.high_risk_items.map((risk) => (
							<RiskDetailDialog key={risk.title} risk={risk} />
						))}
						{summary.risk_assessment.medium_risk_items.map((risk) => (
							<RiskDetailDialog key={risk.title} risk={risk} />
						))}
						{summary.risk_assessment.low_risk_items.map((risk) => (
							<RiskDetailDialog key={risk.title} risk={risk} />
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}

const FinanceSection = ({ summary }: { summary: LegalDocumentSummary }) => {
	const getRiskColor = (risk: string) => {
		switch (risk.toLowerCase()) {
			case 'high': return 'bg-red-500';
			case 'medium': return 'bg-yellow-500';
			case 'standard':
			case 'low': return 'bg-green-500';
			default: return 'bg-gray-500';
		}
	};

	return (
		<div className="flex flex-col gap-4 w-full">
			<div className="w-full flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<DollarSign className="h-5 w-5 text-green-600" />
					<h2 className="text-lg font-bold">Financial Terms</h2>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				{summary.key_financial_terms.map((term, index) => (
					<div key={index} className="p-4 border border-color3 rounded-xs hover:bg-color2 transition-colors">
						<div className="flex items-start justify-between mb-2">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<h4 className="font-inter font-semibold text-sm">{term.term}</h4>
									<Badge className={`rounded-xs font-inter text-xs capitalize ${getRiskColor(term.risk_level)}`}>
										{term.risk_level}
									</Badge>
								</div>
								<p className="font-inter text-lg font-bold text-green-600 mb-2">{term.amount}</p>
								<p className="font-inter text-xs text-gray-600 leading-relaxed">{term.description}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

const DatesSection = ({ summary }: { summary: LegalDocumentSummary }) => {
	const getImportanceColor = (importance: string) => {
		switch (importance.toLowerCase()) {
			case 'high': return 'bg-red-500';
			case 'medium': return 'bg-yellow-500';
			case 'low': return 'bg-green-500';
			default: return 'bg-gray-500';
		}
	};

	return (
		<div className="flex flex-col gap-4 w-full">
			<div className="w-full flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<Calendar className="h-5 w-5 text-blue-600" />
					<h2 className="text-lg font-bold">Important Dates</h2>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				{summary.important_dates.map((date, index) => (
					<div key={index} className="p-4 border border-color3 rounded-xs hover:bg-color2 transition-colors">
						<div className="flex items-start justify-between mb-2">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<h4 className="font-inter font-semibold text-sm">{date.event}</h4>
									<Badge className={`rounded-xs font-inter text-xs capitalize ${getImportanceColor(date.importance)}`}>
										{date.importance}
									</Badge>
								</div>
								<div className="flex items-center gap-2 text-blue-600 font-semibold text-sm font-inter mb-2">
									<Clock className="h-4 w-4" />
									{date.date}
								</div>
								<p className="font-inter text-xs text-gray-600 leading-relaxed">{date.description}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

const ObligationsSection = ({ summary }: { summary: LegalDocumentSummary }) => {
	const getCategoryColor = (category: string) => {
		switch (category.toLowerCase()) {
			case 'financial': return 'bg-green-500';
			case 'legal': return 'bg-red-500';
			case 'maintenance': return 'bg-blue-500';
			case 'access': return 'bg-purple-500';
			default: return 'bg-gray-500';
		}
	};

	const getCategoryIcon = (category: string) => {
		switch (category.toLowerCase()) {
			case 'financial': return <DollarSign className="h-3 w-3" />;
			case 'legal': return <Scale className="h-3 w-3" />;
			default: return <FileText className="h-3 w-3" />;
		}
	};

	return (
		<div className="flex flex-col gap-4 w-full">
			<div className="w-full flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<Scale className="h-5 w-5 text-purple-600" />
					<h2 className="text-lg font-bold">Key Obligations</h2>
				</div>
			</div>
			<div className="space-y-3">
				{summary.key_obligations.map((obligation, index) => (
					<div key={index} className="p-4 border border-color3 rounded-xs hover:bg-color2 transition-colors">
						<div className="flex items-start justify-between mb-2">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<Badge className={`rounded-xs font-inter text-xs capitalize flex items-center gap-1 ${getCategoryColor(obligation.category)}`}>
										{getCategoryIcon(obligation.category)}
										{obligation.category}
									</Badge>
									<span className="font-inter text-xs text-gray-500">({obligation.party})</span>
								</div>
								<h4 className="font-inter font-semibold text-sm mb-2 leading-snug">{obligation.obligation}</h4>
								<p className="font-inter text-xs text-gray-600 leading-relaxed">{obligation.consequence}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

// PDF Loading Component
const PDFLoadingState = () => {
	return (
		<div className="w-full h-full flex flex-col items-center justify-center bg-color2 rounded-xs">
			<div className="flex flex-col items-center gap-4 p-8">
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
				<div className="text-center space-y-2">
					<p className="font-inter text-sm font-medium text-gray-700">Loading Document</p>
					<p className="font-inter text-xs text-gray-500">Please wait while we process your PDF...</p>
				</div>
				<div className="w-48 h-64 bg-white border border-color3 rounded-xs p-4">
					<Skeleton className="w-full h-4 bg-color3 mb-3" />
					<Skeleton className="w-3/4 h-3 bg-color3 mb-2" />
					<Skeleton className="w-full h-3 bg-color3 mb-2" />
					<Skeleton className="w-5/6 h-3 bg-color3 mb-4" />
					<Skeleton className="w-full h-3 bg-color3 mb-2" />
					<Skeleton className="w-2/3 h-3 bg-color3 mb-2" />
					<Skeleton className="w-full h-3 bg-color3 mb-2" />
					<Skeleton className="w-4/5 h-3 bg-color3" />
				</div>
			</div>
		</div>
	);
};

// Download function for base64 files
const downloadFromBase64 = (base64String: string, fileName: string, mimeType: string = "application/pdf") => {
	const linkSource = `data:${mimeType};base64,${base64String}`;
	const downloadLink = document.createElement("a");
	downloadLink.href = linkSource;
	downloadLink.download = fileName;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
};

// Documents Dialog Component
const DocumentsDialog = ({ files, isLoading }: { files: Record<string, string> | null, isLoading: boolean }) => {
	const handleDownload = (fileName: string, base64Data: string) => {
		downloadFromBase64(base64Data, fileName);
	};

	if (isLoading) {
		return (
			<NavigationMenuLink className="font-bold rounded-xs hover:bg-color2 font-inter p-2 cursor-not-allowed">
				<Skeleton className="h-4 w-20 bg-color3" />
			</NavigationMenuLink>
		);
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<NavigationMenuLink className="font-bold rounded-xs hover:bg-color2 font-inter cursor-pointer p-2">
					Documents
				</NavigationMenuLink>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-xs">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-inter text-lg">
						Available Documents
					</DialogTitle>
					<DialogDescription className="font-inter text-sm">
						Download your legal documents
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					{!files || Object.entries(files).length === 0 ? (
						<p className="text-center text-gray-500 font-inter text-sm py-8">
							No documents available for download
						</p>
					) : (
						<div className="space-y-3">
							{Object.entries(files).map(([fileName, base64Data]) => (
								<div
									key={fileName}
									className="flex items-center justify-between p-4 border border-color3 rounded-xs hover:bg-color2 transition-colors"
								>
									<div className="flex items-center gap-5">
										<Image src="./../../adobe_color.svg" alt="pdf" height={16} width={16} />
										<div>
											<p className="font-inter font-medium text-sm">{fileName}</p>
											<p className="font-inter text-xs text-gray-500">PDF Document</p>
										</div>
									</div>
									<Button
										onClick={() => handleDownload(fileName, base64Data)}
										variant="outline"
										size="sm"
										className="font-inter rounded-xs flex items-center gap-2"
									>
										<Download className="h-4 w-4" />
										Download
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" className="font-inter rounded-xs">
							Close
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

const RiskDetailDialog = ({ risk }: { risk: RiskItem }) => {
	const getSeverityIcon = (severity: string) => {
		switch (severity.toLowerCase()) {
			case 'high': return <AlertTriangle className="h-5 w-5 text-red-500" />;
			case 'medium': return <Shield className="h-5 w-5 text-yellow-500" />;
			case 'low': return <CheckCircle className="h-5 w-5 text-green-500" />;
			default: return <Shield className="h-5 w-5 text-gray-500" />;
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity.toLowerCase()) {
			case 'high': return 'bg-red-500';
			case 'medium': return 'bg-yellow-500';
			case 'low': return 'bg-green-500';
			default: return 'bg-gray-500';
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<TableRow className="cursor-pointer hover:bg-color2">
					<TableCell>
						<Badge className={`rounded-xs font-inter tracking-tight text-xs capitalize ${getSeverityColor(risk.severity)}`}>
							{risk.severity}
						</Badge>
					</TableCell>
					<TableCell>
						<p className="truncate font-inter text-xs tracking-tight">{risk.title}</p>
					</TableCell>
				</TableRow>
			</DialogTrigger>
			<DialogContent className="rounded-xs max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-inter text-lg overflow-x-auto">
						{getSeverityIcon(risk.severity)}
						{risk.title}
					</DialogTitle>
					<DialogDescription className="font-inter text-sm">
						<Badge className={`rounded-xs font-inter text-xs capitalize ${getSeverityColor(risk.severity)} mb-2`}>
							{risk.severity} Risk
						</Badge>
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-6 font-inter">
					<div>
						<h3 className="font-inter font-bold text-sm mb-2">Description</h3>
						<p className="font-inter text-sm text-gray-700 leading-relaxed">{risk.description}</p>
					</div>
					<div>
						<h3 className="font-bold text-sm mb-2">Why This is Risky</h3>
						<p className="text-sm text-gray-700 leading-relaxed">{risk.why_risky}</p>
					</div>
					<div className="bg-color2 p-4 rounded-xs">
						<h3 className="font-bold text-sm mb-2">Source Reference</h3>
						<p className="text-xs text-gray-500">
							Found on page {risk.source_citation.page_number} of the document
						</p>
					</div>
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" className="font-inter rounded-xs">
							Close
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

const ChatPanel = ({
	isOpen,
	onClose,
	conversationId,
	files
}: {
	isOpen: boolean,
	onClose: () => void,
	conversationId: string,
	files: Record<string, string> | null
}) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [isPendingTransition, startTransition] = useTransition();
	const chatTextAreaRef = useRef<HTMLTextAreaElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [activeFiles, setActiveFiles] = useState<string[]>([]);

	// Initialize activeFiles when files are loaded
	useEffect(() => {
		if (!files) return;
		setActiveFiles(Object.keys(files));
	}, [files]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const call = async () => {
		if (!inputValue.trim() || isStreaming) return;

		const currentQuery = inputValue.trim();
		setInputValue("");
		if (chatTextAreaRef.current) {
			chatTextAreaRef.current.value = "";
		}

		const userMessageId = `msg_${Date.now()}`;
		const optimisticUserMessage: Message = {
			id: userMessageId,
			role: 'user',
			content: [{ type: "text", text: currentQuery }],
			timestamp: new Date(),
		};

		setMessages(prev => [...prev, optimisticUserMessage]);

		const loadingMessageId = `loading_${Date.now()}`;
		const loadingMessage: Message = {
			id: loadingMessageId,
			role: 'assistant',
			content: "Working...",
			timestamp: new Date(),
		};

		setMessages(prev => [...prev, loadingMessage]);

		startTransition(async () => {
			try {
				setIsStreaming(true);

				const cq: ContentItem[] = [
					{ type: "text", text: currentQuery }
				];

				// Add files to the query if they exist
				if (files && Object.keys(files).length > 0) {
					for (const [fileName, base64Data] of Object.entries(files)) {
						cq.push({
							type: "file",
							base64: base64Data,
							mime_type: "application/pdf"
						});
					}
				}

				const data = { query: cq };
				const response = await callLLM(data);

				if (response) {
					const aiMessage: Message = {
						id: `msg_${Date.now()}`,
						role: 'assistant',
						content: response.content || response.message || "I received your message but couldn't generate a response.",
						timestamp: new Date()
					};

					setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId).concat(aiMessage));
				} else {
					throw new Error('No response from API');
				}

			} catch (error) {
				console.error("Error calling API:", error);

				const errorMessage: Message = {
					id: `msg_${Date.now()}`,
					role: 'assistant',
					content: "Sorry, there was an error processing your request. Please try again.",
					timestamp: new Date()
				};

				setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId).concat(errorMessage));
			} finally {
				setIsStreaming(false);
			}
		});
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputValue(e.target.value);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
			<div className="bg-white rounded-xs shadow-xl w-[90%] h-[90%] max-w-4xl flex flex-col">
				{/* Chat Header */}
				<div className="flex items-center justify-between p-4 border-b border-color3">
					<div className="flex items-center gap-2">
						<h2 className="font-inter tracking-tight font-semibold">Chat with Document</h2>
						{activeFiles.length > 0 && (
							<Badge className="tracking-tight bg-green-100 text-green-800 text-xs">
								{activeFiles.length} file{activeFiles.length !== 1 ? 's' : ''} loaded
							</Badge>
						)}
					</div>
					<Button onClick={onClose} variant="ghost" size="sm">
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Active Files Display */}
				{activeFiles.length > 0 && (
					<div className="px-4 py-2 bg-color2 border-b border-color3">
						<div className="flex font-inter text-xs font-bold text-gray-600 tracking-tight gap-2 flex-wrap">
							{activeFiles.map((fileName) => (
								<div key={fileName} className="p-2 flex gap-2 items-center bg-white rounded-xs border border-color3">
									<Image src="/adobe_color.svg" alt="pdf" height={12} width={12} />
									<span className="truncate text-xs">{fileName}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.length === 0 && (
						<div className="text-center text-gray-500 font-inter text-sm py-8">
							<div className="space-y-2">
								<MessageCircle className="h-8 w-8 mx-auto text-gray-400" />
								<p className="font-medium tracking-tight">Ask me anything about your legal document</p>
								<p className="text-xs text-gray-400 tracking-tight">
									{activeFiles.length > 0
										? `I have access to ${activeFiles.length} document${activeFiles.length !== 1 ? 's' : ''} from this conversation`
										: "Upload documents to get started"
									}
								</p>
							</div>
						</div>
					)}
					{messages.map((message: Message) => {
						const content = message.role === "user"
							? Array.isArray(message.content)
								? message.content.find(c => c.type === "text")?.text || ""
								: message.content
							: message.content as string;

						return (
							<div key={message.id}>
								<ChatMessage
									content={content}
									role={message.role}
								/>
							</div>
						);
					})}
					<div ref={messagesEndRef} />
				</div>

				{/* Input Area */}
				<div className="p-4 border-t border-color3">
					<div className="flex gap-2 items-end">
						<div className="flex-1 bg-color2 border border-color3 rounded-xs">
							<TextareaAutosize
								ref={chatTextAreaRef}
								className="w-full resize-none rounded-xs outline-none bg-color2 p-3 text-foreground tracking-tight font-inter text-sm"
								placeholder={
									activeFiles.length > 0
										? "Ask about your legal document..."
										: "Load documents first to chat about them..."
								}
								value={inputValue}
								onChange={handleInputChange}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										call();
									}
								}}
								disabled={isStreaming || activeFiles.length === 0}
								maxRows={4}
							/>
						</div>
						<Button
							onClick={call}
							disabled={!inputValue.trim() || isStreaming || activeFiles.length === 0}
							size="sm"
							className="rounded-xs"
						>
							<Send className="h-4 w-4" />
						</Button>
					</div>
					{activeFiles.length === 0 && (
						<p className="text-xs text-gray-500 font-inter mt-2 text-center">
							Documents are automatically loaded from this conversation
						</p>
					)}
				</div>
			</div>
		</div>
	);
};
// Chat Panel Component

export default function Chat({ params }) {
	const resolvedParams = React.use(params);
	const { conv_id } = resolvedParams;
	const [conversation, setConversation] = useState(null);
	const [summary, setSummary] = useState<LegalDocumentSummary>();
	const [files, setFiles] = useState<Record<string, string> | null>(null);
	const [filesLoading, setFilesLoading] = useState(true);
	const [activeSection, setActiveSection] = useState('summary');
	const [isChatOpen, setIsChatOpen] = useState(false); // New state for chat panel

	const {
		data: session,
		isPending,
		error,
		refetch
	} = authClient.useSession()

	const [decoded, useDecoded] = useState("");
	const [bb, setBB] = useState<BoundingBox[]>();

	// Fetch Data
	useEffect(() => {
		async function getConversations(user_id: string) {
			const response = await get_conversations({ "user_id": user_id, "conversation_id": conv_id });
			setConversation((state) => response)
			console.log(response)
			setSummary((state) => response.conversations.summary)
			setBB((s) => {
				let data = response.conversations.summary.risk_assessment.high_risk_items
				const req = [];
				for (let v of data) {
					let xx = v.source_citation;
					const d = { "x": xx.bounding_box.x, "y": xx.bounding_box.y, "width": xx.bounding_box.width, "height": xx.bounding_box.height, "pageNumber": xx.page_number, "color": "border-red-500" }
					req.push(d)
				}
				data = response.conversations.summary.risk_assessment.medium_risk_items
				for (let v of data) {
					let xx = v.source_citation;
					const d = { "x": xx.bounding_box.x, "y": xx.bounding_box.y, "width": xx.bounding_box.width, "height": xx.bounding_box.height, "pageNumber": xx.page_number, "color": "border-yellow-500" }
					req.push(d)
				}
				data = response.conversations.summary.risk_assessment.low_risk_items
				for (let v of data) {
					let xx = v.source_citation;
					const d = { "x": xx.bounding_box.x, "y": xx.bounding_box.y, "width": xx.bounding_box.width, "height": xx.bounding_box.height, "pageNumber": xx.page_number, "color": "border-green-500" }
					req.push(d)
				}
				return req
			})
		}

		async function getFiles(user_id: string) {
			setFilesLoading(true);
			try {
				const response = await get_files({ "user_id": user_id, "conversation_id": conv_id });
				setFiles(response.files)
				let dt = null;
				for (let [k, v] of Object.entries(response.files)) {
					dt = v;
					break;
				}
				const d = "data:application/pdf;base64," + dt;
				useDecoded((x) => d);
			} catch (error) {
				console.error("Error loading files:", error);
			} finally {
				setFilesLoading(false);
			}
		}

		if (session) {
			getConversations(session.user.id);
			getFiles(session.user.id);
		}
	}, [session])

	// Function to render the active section content
	const renderActiveSection = () => {
		if (!summary) return null;

		switch (activeSection) {
			case 'finance':
				return <FinanceSection summary={summary} />;
			case 'risks':
				return <RiskAssessment summary={summary} />;
			case 'dates':
				return <DatesSection summary={summary} />;
			case 'obligations':
				return <ObligationsSection summary={summary} />;
			default:
				return <SummaryHighlights summary={summary} />;
		}
	};

	if (summary) {
		return (
			<SidebarProvider defaultOpen={false}>
				<SpecSidebar />
				<SidebarInset>
					<div className="w-full max-h-screen flex flex-col">
						<div className="h-auto p-2">
							<NavigationMenu viewport={false}>
								<NavigationMenuList>
									<NavigationMenuItem className="rounded-xs">
										<NavigationMenuLink asChild className="font-bold rounded-xs hover:bg-color2 font-inter cursor-pointer p-2">
											<Link href={"/"}>Dashboard</Link>
										</NavigationMenuLink>
									</NavigationMenuItem>
									<NavigationMenuItem className="rounded-xs">
										<DocumentsDialog files={files} isLoading={filesLoading} />
									</NavigationMenuItem>
									{/* Add Chat Button */}
									<NavigationMenuItem className="rounded-xs">
										<NavigationMenuLink
											onClick={() => setIsChatOpen(true)}
											className="font-bold rounded-xs hover:bg-color2 font-inter cursor-pointer p-2 flex items-center gap-2"
										>
											Chat
										</NavigationMenuLink>
									</NavigationMenuItem>
								</NavigationMenuList>
							</NavigationMenu>
						</div>

						<div className="w-full flex-1 flex flex-row gap-10 py-[24px] font-merri">
							{/* PDF viewer takes 30% */}
							<div className="w-[30%] h-full border-r">
								{filesLoading || decoded.length === 0 ? (
									<PDFLoadingState />
								) : (
									<MyPdf pdfBase64={decoded} boundingBoxes={bb} />
								)}
							</div>
							{/* Remaining content takes 70% */}
							<div className="w-[70%] flex flex-col gap-4 overflow-y-auto">
								<header className="flex justify-between">
									<div className="flex flex-col">
										<h1 className="text-xl">{summary.document_overview.title}</h1>
										<p className="font-light text-xs">{summary.document_overview.effective_period}</p>
									</div>
									<div className="flex items-center">
										{summary.document_overview.primary_parties.map((party) => (
											<div key={party.name}>
												<Avatar className="-ml-2">
													<AvatarFallback className="bg-background border border-color3 font-light cursor-pointer">
														{party.name[0]}
													</AvatarFallback>
												</Avatar>
											</div>
										))}
									</div>
								</header>
								<Separator />
								{/* Navigation and content */}
								<div className="w-full justify-center items-center flex text-sm gap-4">
									<p
										className={`hover:underline cursor-pointer px-2 py-1 rounded-xs transition-colors ${activeSection === 'finance' ? 'bg-color3 font-semibold' : 'hover:bg-color2'
											}`}
										onClick={() => setActiveSection('finance')}
									>
										Finance ({summary.key_financial_terms.length})
									</p>
									|
									<p
										className={`hover:underline cursor-pointer px-2 py-1 rounded-xs transition-colors ${activeSection === 'risks' ? 'bg-color3 font-semibold' : 'hover:bg-color2'
											}`}
										onClick={() => setActiveSection('risks')}
									>
										Risks ({summary.risk_assessment.high_risk_items.length + summary.risk_assessment.medium_risk_items.length + summary.risk_assessment.low_risk_items.length})
									</p>
									|
									<p
										className={`hover:underline cursor-pointer px-2 py-1 rounded-xs transition-colors ${activeSection === 'dates' ? 'bg-color3 font-semibold' : 'hover:bg-color2'
											}`}
										onClick={() => setActiveSection('dates')}
									>
										Dates ({summary.important_dates.length})
									</p>
									|
									<p
										className={`hover:underline cursor-pointer px-2 py-1 rounded-xs transition-colors ${activeSection === 'obligations' ? 'bg-color3 font-semibold' : 'hover:bg-color2'
											}`}
										onClick={() => setActiveSection('obligations')}
									>
										Obligations ({summary.key_obligations.length})
									</p>
								</div>
								<Separator />
								{/* Render selected section */}
								{renderActiveSection()}
							</div>
						</div>

						{/* Chat Panel */}
						<ChatPanel
							isOpen={isChatOpen}
							onClose={() => setIsChatOpen(false)}
							conversationId={conv_id}
							files={files} // Pass the loaded files
						/>
					</div>
				</SidebarInset>
			</SidebarProvider>
		)
	} else {
		return <></>
	}
}
