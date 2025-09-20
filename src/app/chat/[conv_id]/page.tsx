"use client"
import Image from "next/image";
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
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SpecSidebar } from "@/components/sidebar";
import { Accordion, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PdfViewerWithBoxes from "@/components/pdfView";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client"
import { get_conversations, get_files } from "@/lib/action";
import React from "react";
import { LegalDocumentSummary } from "@/lib/models";
import dynamic from "next/dynamic";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Shield, Download, FileText } from "lucide-react";
import Link from "next/link";

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

// Risk item interface
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

const MyPdf = dynamic(
	() => import('@/components/pdfView'),
	{ ssr: false }
);

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

	// Show skeleton loading state
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
			case 'high':
				return <AlertTriangle className="h-5 w-5 text-red-500" />;
			case 'medium':
				return <Shield className="h-5 w-5 text-yellow-500" />;
			case 'low':
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			default:
				return <Shield className="h-5 w-5 text-gray-500" />;
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity.toLowerCase()) {
			case 'high':
				return 'bg-red-500';
			case 'medium':
				return 'bg-yellow-500';
			case 'low':
				return 'bg-green-500';
			default:
				return 'bg-gray-500';
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
					{/* Description */}
					<div>
						<h3 className="font-inter font-bold text-sm mb-2">Description</h3>
						<p className="font-inter text-sm text-gray-700 leading-relaxed">{risk.description}</p>
					</div>
					{/* Why Risky */}
					<div>
						<h3 className="font-bold text-sm mb-2">Why This is Risky</h3>
						<p className="text-sm text-gray-700 leading-relaxed">{risk.why_risky}</p>
					</div>
					{/* Source Citation */}
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

export default function Chat({ params }) {
	const resolvedParams = React.use(params);
	const { conv_id } = resolvedParams;
	const [conversation, setConversation] = useState(null);
	const [summary, setSummary] = useState<LegalDocumentSummary>();
	const [files, setFiles] = useState<Record<string, string> | null>(null);
	const [filesLoading, setFilesLoading] = useState(true);
	const {
		data: session,
		isPending, //loading state
		error, //error object
		refetch //refetch the session
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
				const d = "data:application/pdf;base64," + response.files['rental_02.pdf']
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

	if (summary) {
		return (
			<div className="w-full h-screen flex flex-col">
				<div className="p-2">
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
						</NavigationMenuList>
					</NavigationMenu>
				</div>
				<div className="w-full h-screen grid grid-cols-3 gap-10 py-[24px] font-merri">
					<div className="w-full h-full border-r ">
					</div>
					<div className="w-full flex flex-col gap-4">
						<header className="flex justify-between">
							<div className="flex flex-col">
								<h1 className="text-xl">{summary.document_overview.title}</h1>
								<p className="font-light text-xs">{summary.document_overview.effective_period}</p>
							</div>
							<div className="flex items-center">
								{summary.document_overview.primary_parties.map((party) => {
									return (
										<div key={party.name} className="">
											<Avatar className="-ml-2">
												<AvatarFallback className="bg-background border border-color3 font-light cursor-pointer">
													{party.name[0]}
												</AvatarFallback>
											</Avatar>
										</div>
									)
								})}
							</div>
						</header>
						<Separator />
						{/* Status Count */}
						<div className="w-full justify-center items-center flex text-sm gap-4">
							<p className="hover:underline cursor-pointer">Finance ({summary.key_financial_terms.length})</p>
							|
							<p className="hover:underline cursor-pointer">Risks ({summary.risk_assessment.high_risk_items.length + summary.risk_assessment.medium_risk_items.length + summary.risk_assessment.low_risk_items.length})</p>
							|
							<p className="hover:underline cursor-pointer">Dates ({summary.important_dates.length})</p>
							|
							<p className="hover:underline cursor-pointer">Obligations ({summary.key_obligations.length})</p>
						</div>
						<Separator />
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
										{/* High Risk Items */}
										{summary.risk_assessment.high_risk_items.map((risk) => (
											<RiskDetailDialog key={risk.title} risk={risk} />
										))}
										{/* Medium Risk Items */}
										{summary.risk_assessment.medium_risk_items.map((risk) => (
											<RiskDetailDialog key={risk.title} risk={risk} />
										))}
										{/* Low Risk Items */}
										{summary.risk_assessment.low_risk_items.map((risk) => (
											<RiskDetailDialog key={risk.title} risk={risk} />
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					</div>
					<div>
						{/* {decoded.length > 0 && ( */}
						{/* 	<MyPdf pdfBase64={decoded} boundingBoxes={bb} /> */}
						{/* )} */}
					</div>
				</div>
			</div>
		)
	} else {
		return <></>
	}
}
