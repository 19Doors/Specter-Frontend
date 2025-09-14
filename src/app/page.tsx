"use client"
import Image from "next/image";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import "./globals.css"
import TextareaAutosize from 'react-textarea-autosize';
import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap';
import { SplitText } from 'gsap/src/SplitText'
import { useGSAP } from '@gsap/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Paperclip, Plus } from "lucide-react";
import Markdown from "react-markdown";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { ChatMessage } from "@/components/ChatMessage";
import { FileUploadButton } from "@/components/FileUploadButton";
import { useFilesChat } from '@/hooks/useFileUpload';

// Register the plugin
gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

interface Message {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

export default function Home() {
	const [query, setQuery] = useState("");
	const [isActive, setIsActive] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingContent, setStreamingContent] = useState("");
	const [activeFiles, setActiveFiles] = useState([]);
	const threadTitle = "Summarize two-page document."
	const files = useFilesChat((state) => state.files);

	useEffect(() => {}, [activeFiles]);
	useEffect(() => {
		if (!files) return;
		console.log(files.item(0).name);

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

	// Timeline ref for scene transitions
	const tl = useRef<gsap.core.Timeline>();

	// GSAP animation setup
	const { contextSafe } = useGSAP(() => {
		// Create main timeline for scene transitions
		tl.current = gsap.timeline({ paused: true });

		// Set initial states
		gsap.set(chatSceneRef.current, {
			opacity: 0,
			y: 50,
			display: 'none'
		});

		// Define the transition timeline
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
				"-=0.2" // Start slightly before the previous animation ends
			)
			.set(landingSceneRef.current, {
				display: 'none'
			});

	}, { scope: containerRef });

	// Context-safe transition function
	const triggerSceneTransition = contextSafe(() => {
		if (tl.current && !isActive) {
			setIsActive(true);
			tl.current.play();
		}
	});

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const call = async () => {
		if (!query.trim() || isStreaming) return;

		// Trigger scene transition if not active
		if (!isActive) {
			triggerSceneTransition();

			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		const currentQuery = query;
		const userMessage: Message = {
			id: `msg_${Date.now()}`,
			role: 'user',
			content: currentQuery,
			timestamp: new Date()
		};

		setMessages(prev => [...prev, userMessage]);
		setQuery("");

		const data = {
			query: query
		};

		const response = await fetch("http://127.0.0.1:8000/llmcall", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			}, body: JSON.stringify(data)
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		// console.log(await response.json());
		const rdata = await response.json()
		console.log(rdata);

		const aiMessage: Message = {
			id: `msg_${Date.now()}`,
			role: 'assistant',
			content: rdata.content,
			timestamp: new Date()
		};

		setMessages(prev => [...prev, aiMessage]);
		// Scroll to bottom after message is added
		setTimeout(scrollToBottom, 100);
	};

	return (
		<div ref={containerRef} className="h-screen w-full overflow-hidden">

			{/* Landing Scene */}
			<div
				ref={landingSceneRef}
				className="landing-scene flex justify-center items-center h-screen w-full absolute inset-0"
			>
				<div className="flex flex-col justify-center items-center text-center space-y-12 h-screen w-1/3">
					<div className="flex flex-col text-2xl">
						<p className="font-merri font-bold">
							Private, grounded explanation
						</p>
						<p className="font-merri font-bold">
							with line-by-line citations.
						</p>
					</div>
					<div className="w-full flex flex-col gap-sm bg-[#F5F5F5] border-1 border-[#E0E0E0] rounded-sm">
						{activeFiles.length!=0 && (
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
							className="w-full resize-none rounded-sm outline-none bg-[#F5F5F5] p-[18px] text-[#4d4d4d] font-inter tracking-tight text-xs"
							placeholder="Ask about your legal document..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
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
									<Button variant="link" size="sm" className="text-color2 shadow-none text-[14px] font-inter tracking-tight font-bold outline-none rounded-xs"><Plus size={10} /> Files and sources</Button>

								</DropdownMenuTrigger>
								<DropdownMenuContent className="rounded-xs">
									<FileUploadButton accept=".pdf" className="p-2 cursor-pointer font-inter tracking-tighter font-bold text-[14px]">
										Upload Files from Computer
									</FileUploadButton>
								</DropdownMenuContent>
							</DropdownMenu>
							{/* <Button variant="link" size="sm" className="text-color2 shadow-none text-[14px] font-merri font-bold"><Plus size={10} /> Files and sources</Button> */}
						</div>
					</div>
				</div>
			</div>

			{/* Chat Scene */}
			<div
				ref={chatSceneRef}
				className="chat-scene hidden h-screen flex-col absolute inset-0"
			>
				<header className="font-bold h-auto text-xl font-merri m-2">
					{threadTitle}
				</header>
				<div className="w-full h-full flex justify-center items-center ">
					<div className="w-1/3 h-screen flex flex-col gap-4">
						{messages.map((message: Message) => {

							let split = SplitText.create(".split", { type: "words, chars" });
							gsap.from(split.chars, {
								duration: 5,
								y: 100,
								autoAlpha: 0,
								stagger: 0.05
							})
							return (
								<ChatMessage key={message.id} content={message.content} role={message.role} />
							);
						})}
					</div>

					<div className="absolute w-full bottom-10 flex justify-center">
						<div className="w-1/3 flex flex-col gap-sm bg-[#F5F5F5] border-1 border-[#E0E0E0] rounded-sm">
							<TextareaAutosize
								className="w-full resize-none rounded-sm outline-none bg-[#F5F5F5] p-[18px] text-[#4d4d4d] font-merri text-xs"
								placeholder="Ask about your legal document..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										call();
									}
								}}
							/>
						</div>
					</div>
				</div>
			</div>

		</div>
	);
}
