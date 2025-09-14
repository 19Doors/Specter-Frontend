"use client"
import Image from "next/image";
import "./globals.css"
import TextareaAutosize from 'react-textarea-autosize';
import { useState, useRef, useEffect, useTransition } from 'react'
import { gsap } from 'gsap';
import { SplitText } from 'gsap/src/SplitText'
import { useGSAP } from '@gsap/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { FileUploadButton } from "@/components/FileUploadButton";
import { useFilesChat } from '@/hooks/useFileUpload';

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

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

export default function Home() {
	let query = "";
	let isActive = false;
	const [messages, setMessages] = useState<Message[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingContent, setStreamingContent] = useState("");
	const [activeFiles, setActiveFiles] = useState([]);
	const [inputValue, setInputValue] = useState(""); // Add controlled input state
	const [isPending, startTransition] = useTransition(); // Add transition hook

	const threadTitle = "Summarize two-page document."
	const files = useFilesChat((state) => state.files);
	const setFiles = useFilesChat((state) => state.setFiles);

	useEffect(() => { }, [activeFiles]);

	useEffect(() => {
		if (!files) return;
		setActiveFiles([]); // Clear first to avoid duplicates
		for (let i = 0; i < files?.length; i++) {
			setActiveFiles((state) => ([...state, files.item(i).name]));
		}
	}, [files]);

	// Refs for GSAP animations
	const containerRef = useRef(null);
	const landingSceneRef = useRef(null);
	const chatSceneRef = useRef(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const msgContentRef = useRef(null);
	const chatTextAreaRef = useRef<HTMLTextAreaElement>(null);
	const landingTextAreaRef = useRef<HTMLTextAreaElement>(null);
	const tl = useRef<gsap.core.Timeline>();

	const { contextSafe } = useGSAP(() => {
		tl.current = gsap.timeline({ paused: true });
		gsap.set(chatSceneRef.current, {
			opacity: 0,
			y: 50,
			display: 'none'
		});
		tl.current
			.to(landingSceneRef.current, {
				opacity: 0,
				y: -30,
				duration: 0.6,
				ease: "power2.inOut"
			})
			.set(chatSceneRef.current, {
				display: 'flex'
			})
			.fromTo(chatSceneRef.current,
				{
					opacity: 0,
					y: 30
				},
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: "power2.out"
				},
				"-=0.2"
			)
			.set(landingSceneRef.current, {
				display: 'none'
			});
	}, { scope: containerRef });

	const triggerSceneTransition = contextSafe(() => {
		if (tl.current && !isActive) {
			isActive = true;
			tl.current.play();
		}
	});

	const call = async () => {
		if (!inputValue.trim() || isStreaming) return;

		const currentQuery = inputValue.trim();

		// IMMEDIATE UI UPDATES 
		// 1. Clear input immediately
		setInputValue("");
		if (chatTextAreaRef.current) {
			chatTextAreaRef.current.value = "";
		}
		if (landingTextAreaRef.current) {
			landingTextAreaRef.current.value = "";
		}

		// 2. Trigger scene transition immediately if needed
		if (!isActive) {
			triggerSceneTransition();
			setActiveFiles([]);
		}

		// 3. Add user message immediately (optimistic)
		const userMessageId = `msg_${Date.now()}`;
		const optimisticUserMessage: Message = {
			id: userMessageId,
			role: 'user',
			content: [{ type: "text", text: currentQuery }],
			timestamp: new Date(),
		};

		setMessages(prev => [...prev, optimisticUserMessage]);

		// 4. Add loading message immediately
		const loadingMessageId = `loading_${Date.now()}`;
		const loadingMessage: Message = {
			id: loadingMessageId,
			role: 'assistant',
			content: "Working",
			timestamp: new Date(),
		};

		setMessages(prev => [...prev, loadingMessage]);

		// BACKGROUND PROCESSING (Non-blocking)
		startTransition(async () => {
			try {
				setIsStreaming(true);

				const cq: ContentItem[] = [
					{ type: "text", text: currentQuery }
				];

				// Process files asynchronously
				if (files?.length > 0) {
					const filePromises = [];
					for (let i = 0; i < files.length; i++) {
						const file = files.item(i);
						if (file) {
							const filePromise = new Promise<FileContent>((resolve) => {
								const reader = new FileReader();
								reader.onload = function(e) {
									const base64String = e.target?.result as string;
									const pureBase64 = base64String.split(',')[1];
									resolve({
										type: "file",
										base64: pureBase64,
										mime_type: file.type || "application/pdf"
									});
								};
								reader.readAsDataURL(file);
							});
							filePromises.push(filePromise);
						}
					}

					const fileContents = await Promise.all(filePromises);
					cq.push(...fileContents);
				}

				// Update user message with files if any
				if (cq.length > 1) {
					setMessages(prev => prev.map(msg =>
						msg.id === userMessageId
							? { ...msg, content: cq}
							: msg
					));
				} else {
					// Mark user message as confirmed
					setMessages(prev => prev.map(msg =>
						msg.id === userMessageId
							? { ...msg}
							: msg
					));
				}

				setFiles(null);

				const data = { query: cq };

				const response = await fetch("http://127.0.0.1:8000/llmcall", {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data)
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const rdata = await response.json();

				// Replace loading message with actual response
				const aiMessage: Message = {
					id: `msg_${Date.now()}`,
					role: 'assistant',
					content: rdata.content,
					timestamp: new Date()
				};

				setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId).concat(aiMessage));

			} catch (error) {
				console.error("Error calling API:", error);

				// Replace loading message with error message
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
		const value = e.target.value;
		setInputValue(value);
		query = value; // Keep for compatibility
	};

	return (
		<div ref={containerRef} className="h-screen w-full overflow-hidden">
			{/* Landing Scene */}
			<div
				ref={landingSceneRef}
				className="flex justify-center items-center h-screen w-full absolute inset-0"
			>
				<div className="flex flex-col justify-center items-center text-center space-y-12 h-screen md:w-1/3">
					<div className="flex flex-col text-2xl">
						<p className="font-merri font-bold">
							Private, grounded explanation
						</p>
						<p className="font-merri font-bold">
							with line-by-line citations.
						</p>
					</div>
					<div className="w-full flex flex-col gap-sm bg-[#F5F5F5] border-1 border-[#E0E0E0] rounded-sm">
						{activeFiles.length != 0 && (
							<div className="flex font-inter text-xs font-bold text-bg tracking-tight m-2 gap-2 justify-between">
								{activeFiles.map((f) => {
									return (
										<div key={f} className="p-2 flex gap-2 items-center bg-background rounded-xs flex-1 min-w-0">
											<Image src="./adobe_color.svg" alt="pdf" height={16} width={16} />
											<span className="truncate">{f}</span>
										</div>
									)
								})}
							</div>
						)}
						<TextareaAutosize
							ref={landingTextAreaRef}
							className="w-full resize-none rounded-sm outline-none bg-[#F5F5F5] p-[18px] text-[#4d4d4d] font-inter tracking-tight text-xs"
							placeholder="Ask about your legal document..."
							value={inputValue}
							onChange={handleInputChange}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									call();
								}
							}}
						/>
						<div className="mr-auto text-sm font-merri pl-2 pb-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="link" size="sm" className="text-color2 shadow-none text-[14px] font-inter tracking-tight font-bold outline-none rounded-xs">
										<Plus size={10} /> Files and sources
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="rounded-xs">
									<FileUploadButton accept=".pdf" className="p-2 cursor-pointer font-inter tracking-tighter font-bold text-[14px]">
										Upload Files from Computer
									</FileUploadButton>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>
			</div>

			{/* Chat Scene */}
			<div
				ref={chatSceneRef}
				className="w-full hidden h-screen flex-col absolute inset-0"
			>
				<header className="font-bold h-auto text-xl font-merri m-2">
					{threadTitle}
				</header>

				<div className="flex-1 overflow-y-auto pb-32">
					<div className="w-full flex justify-center">
						<div className="md:w-[40%] flex flex-col gap-4 py-4 px-4 md:px-0">
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
						</div>
					</div>
				</div>

				<div className="fixed bottom-0 left-0 right-0 bg-white p-4">
					<div className="w-full flex justify-center">
						<div className="w-full md:w-1/3 flex flex-col gap-sm bg-[#F5F5F5] border-1 border-[#E0E0E0] rounded-sm">
							{activeFiles.length != 0 && (
								<div className="flex font-inter text-xs font-bold text-bg tracking-tight m-2 gap-2 justify-between">
									{activeFiles.map((f) => {
										return (
											<div key={f} className="p-2 flex gap-2 items-center bg-background rounded-xs flex-1 min-w-0">
												<Image src="./adobe_color.svg" alt="pdf" height={16} width={16} />
												<span className="truncate">{f}</span>
											</div>
										)
									})}
								</div>
							)}
							<TextareaAutosize
								ref={chatTextAreaRef}
								className="w-full resize-none rounded-sm outline-none bg-[#F5F5F5] p-[18px] text-[#4d4d4d] font-inter tracking-tight text-xs"
								placeholder="Ask about your legal document..."
								value={inputValue}
								onChange={handleInputChange}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										call();
									}
								}}
							/>
							<div className="mr-auto text-sm font-merri pl-2 pb-2">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="link" size="sm" className="text-color2 shadow-none text-[14px] font-inter tracking-tight font-bold outline-none rounded-xs">
											<Plus size={10} /> Files and sources
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="rounded-xs">
										<FileUploadButton accept=".pdf" className="p-2 cursor-pointer font-inter tracking-tighter font-bold text-[14px]">
											Upload Files from Computer
										</FileUploadButton>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
