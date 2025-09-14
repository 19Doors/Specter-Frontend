"use client"
import { useRef, useEffect } from 'react'
import { gsap } from 'gsap';
import { SplitText } from 'gsap/src/SplitText'
import { useGSAP } from '@gsap/react';
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";

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
			duration: 0.02,
			stagger: 0.02,
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
			<div className="flex items-start gap-2">
				<Avatar className="border items-center justify-center p-2 size-6 font-inter text-xs">
					<AvatarFallback>S</AvatarFallback>
				</Avatar>
				<div ref={messageRef} className="font-inter tracking-tight text-sm text-wrap" />
			</div>
		);
	} else {
		return (
			<div className="flex items-start gap-2">
				<Avatar className="border items-center justify-center p-2 size-6 font-messi text-xs">
					<AvatarFallback>SS</AvatarFallback>
				</Avatar>
				<div ref={messageRef} className="font-bold font-inter tracking-tight text-sm text-wrap" />
			</div>
		);
	}
}
