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

// Register the plugin
gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

interface MessageProps {
	content: string;
	role: string;
}

export function ChatMessage({ content, role }: MessageProps) {
	const messageRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!messageRef.current) return;

		messageRef.current.textContent = content;

		const split = new SplitText(messageRef.current, { type: "chars" });
		gsap.set(split.chars, { autoAlpha: 0 });

		// Create a timeline
		const tl = gsap.timeline();

		// Reveal characters one by one
		tl.to(split.chars, {
			autoAlpha: 1,
			duration: 0.04,
			stagger: 0.04,
			ease: "none"
		});

		// Optional: add a brief caret blink or delay at end
		// tl.to(messageRef.current, { duration: 0.5, repeat: -1, yoyo: true, ease: "power1.inOut" }, ">");

		// Cleanup on unmount
		return () => {
			tl.kill();
			split.revert();
		};
	}, [content]);

	if (role == "assistant") {
		return (
			<div className="flex items-center gap-2">
				<Avatar className="border items-center justify-center p-2 size-6 font-messi">
					<AvatarFallback>S</AvatarFallback>
				</Avatar>
				<div ref={messageRef} className="font-merri text-sm font-bold whitespace-pre-wrap" />
			</div>
		);
	} else {
		return (
			<div className="flex items-center gap-2">
				<Avatar className="border items-center justify-center p-4 size-2 font-messi text-sm">
					<AvatarFallback>SS</AvatarFallback>
				</Avatar>
				<div ref={messageRef} className="font-merri text-sm font-bold whitespace-pre-wrap" />
			</div>
		);
	}
}
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
	const threadTitle = "Summarize two-page document."

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

		return;

		setIsStreaming(true);
		setStreamingContent("");

		try {
			await fetchEventSource('http://127.0.0.1:8000/llmcall', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ query: currentQuery }),
				onmessage(event) {
					const data = event.data;

					if (data === '[DONE]') {
						const assistantMessage: Message = {
							id: `msg_${Date.now()}`,
							role: 'assistant',
							content: streamingContent,
							timestamp: new Date()
						};

						setMessages(prev => [...prev, assistantMessage]);
						setStreamingContent("");
						setIsStreaming(false);
					} else {
						setStreamingContent(prev => prev + data);
					}
				},
				onerror(err) {
					console.error('Stream error:', err);
					setIsStreaming(false);
				}
			});
		} catch (error) {
			console.error('Request failed:', error);
			setIsStreaming(false);
		}

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
						<div className="mr-auto text-sm font-merri pl-2 pb-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="link" size="sm" className="text-color2 shadow-none text-[14px] font-merri font-bold"><Plus size={10} /> Files and sources</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="rounded-xs">
									<DropdownMenuItem className="font-merri text-[14px] hover:bg-none hover:rounded-xs">
										Upload Files from Computer
									</DropdownMenuItem>
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
					<div className="w-1/3 h-screen">
						{messages.map((message: Message) => {

							let split = SplitText.create(".split", { type: "words, chars" });
							gsap.from(split.chars, {
								duration: 5,
								y: 100,
								autoAlpha: 0,
								stagger: 0.05
							})
							return (
								<div key={message.id} className="flex gap-md">
									<ChatMessage content={message.content} role={message.role}/>
								</div>
							);
							{/* if (message.role == "user") { */ }
							{/* 	return (<div key={message.id} className="flex gap-md font-merri text-sm"><p ref={msgContentRef}>{message.content}</p></div>) */ }
							{/* } */ }
							{/* return (<div key={message.id}>{message.content}</div>); */ }
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
