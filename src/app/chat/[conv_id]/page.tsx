"use client"
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
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client"
import { get_conversations, get_files } from "@/lib/action";
import React from "react";
import { LegalDocumentSummary } from "@/lib/models";
import dynamic from "next/dynamic";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Shield } from "lucide-react";

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
				<TableRow className="cursor-pointer hover:bg-gray-50">
					<TableCell>
						<Badge className={`rounded-xs font-inter text-xs capitalize ${getSeverityColor(risk.severity)}`}>
							{risk.severity}
						</Badge>
					</TableCell>
					<TableCell>
						<p className="truncate font-inter text-xs tracking-tight">{risk.title}</p>
					</TableCell>
				</TableRow>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-merri text-xl">
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
						<h3 className="font-bold text-sm mb-2">Description</h3>
						<p className="text-sm text-gray-700 leading-relaxed">{risk.description}</p>
					</div>

					{/* Why Risky */}
					<div>
						<h3 className="font-bold text-sm mb-2">Why This is Risky</h3>
						<p className="text-sm text-gray-700 leading-relaxed">{risk.why_risky}</p>
					</div>

					{/* Source Citation */}
					<div className="bg-gray-50 p-4 rounded-lg">
						<h3 className="font-bold text-sm mb-2">Source Reference</h3>
						<p className="text-xs text-gray-600">
							Found on page {risk.source_citation.page_number} of the document
						</p>
					</div>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" className="font-inter">
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
	const [files, setFiles] = useState(null);

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
				return req
			})
		}
		async function getFiles(user_id: string) {
			const response = await get_files({ "user_id": user_id, "conversation_id": conv_id });
			setFiles((files) => response.files)

			const d = "data:application/pdf;base64," + response.files['lease.pdf']
			useDecoded((x) => d);
		}
		if (session) {
			getConversations(session.user.id);
			getFiles(session.user.id);

		}
	}, [session])

	if (summary) {


		return (<Dialog><div className="w-full h-screen grid grid-cols-3 gap-10 py-[24px] font-merri">
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
							<Progress value={summary.risk_assessment.overall_risk_score * 10} className="border border-color3"/>
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
									<TableRow key={risk.title} className="cursor-pointer">
										<TableCell>
											<Badge className="rounded-xs font-inter bg-red-500 text-xs capitalize">{risk.severity}</Badge>
										</TableCell>
										<TableCell>
											<p className="truncate font-inter text-xs tracking-tight">{risk.title}</p>
										</TableCell>
									</TableRow>
								))}

								{summary.risk_assessment.medium_risk_items.map((risk) => (
									<TableRow key={risk.title} className="cursor-pointer">
										<TableCell>
											<Badge className="rounded-xs truncate font-inter text-xs capitalize bg-yellow-500">{risk.severity}</Badge>
										</TableCell>
										<TableCell>
											<p className="truncate font-inter text-xs tracking-tight">{risk.title}</p>
										</TableCell>
									</TableRow>
								))}

								{summary.risk_assessment.low_risk_items.map((risk) => (
									<TableRow key={risk.title} className="cursor-pointer">
										<TableCell>
											<Badge className="rounded-xs bg-color3 text-color4 truncate font-inter text-xs capitalize">{risk.severity}</Badge>
										</TableCell>
										<TableCell>
											<p className="truncate font-inter text-xs tracking-tight">{risk.title}</p>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>

			</div>
			<div>
				{decoded.length > 0 && (
					<MyPdf pdfBase64={decoded} boundingBoxes={bb} />
				)}
			</div>
		</div ></Dialog>)
	} else {
		return <></>
	}

}
