"use client"
import { memo, useMemo, useRef, useEffect } from 'react'
import { gsap } from 'gsap';
import { SplitText } from 'gsap/src/SplitText'
import { useGSAP } from '@gsap/react';
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import React from 'react'

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

interface MessageProps {
	content: string;
	role: string;
}
function AnimatedText({ children, element = 'p', className = "", delay = 0 }) {
	const elementRef = useRef(null);

	useGSAP(() => {
		if (!elementRef.current || !children) return;

		// Only animate if children is a string (simple text)
		if (typeof children === 'string') {
			// Set text content for simple strings
			elementRef.current.textContent = children;

			// Create SplitText and animate
			let split = SplitText.create(elementRef.current, { type: "words,chars" });
			gsap.set(split.words, {
				autoAlpha: 0,
				y: 20
			});

			const tl = gsap.timeline({ delay });
			tl.to(split.words, {
				autoAlpha: 1,
				y: 0,
				duration: 0.4,
				stagger: 0.1,
				ease: "back.out(1.7)"
			});

			return () => {
				tl.kill();
				split.revert();
			};
		} else {
			// For complex children (JSX elements), just show them without animation
			// You could implement a different animation strategy here
			gsap.set(elementRef.current, { autoAlpha: 0 });
			gsap.to(elementRef.current, {
				autoAlpha: 1,
				duration: 0.4,
				delay: delay
			});
		}
	}, [children, delay]);

	// For complex children (like ul/li), render them as JSX
	if (typeof children !== 'string') {
		return React.createElement(element, {
			ref: elementRef,
			className: className,
		}, children); // Pass children directly as JSX
	}

	// For simple text, create empty element that will be populated by GSAP
	return React.createElement(element, {
		ref: elementRef,
		className: className,
	});
}


const ChatMessage = memo(({ content, role }: MessageProps) => {

	// Memoize the components object to prevent recreation on every render
	const components = {
		p: ({ children }) => {
			console.log("P")
			console.log(children);
			return <AnimatedText element="p" className="font-inter text-sm">{children}</AnimatedText>
		},
		ul: ({ children }) => {
			console.log("UL")
			console.log(children);
			return <AnimatedText element="ul" className="font-inter text-sm flex flex-col gap-2">{children}</AnimatedText>;
			// return <ul className="font-inter text-sm flex flex-col gap-2">{children}</ul>
		},

		strong: ({ children }) => {
			console.log("STRONG")
			console.log(children);
			return <AnimatedText element="strong" className="font-inter text-sm">{children}</AnimatedText>;
			// return <ul className="font-inter text-sm flex flex-col gap-2">{children}</ul
		},

		li: ({ children }) => {
			console.log("LI")
			console.log(children);
			return <AnimatedText element="li" className="font-inter text-sm">{children}</AnimatedText>;
			// return <ul className="font-inter text-sm flex flex-ol gap-2">{children}</ul>
		},
		table: ({ children }) => {
			console.log("TABLE")
			console.log(children);
			return <table className="font-inter text-sm">{children}</table>;
		},
		thead: ({ children }) => {
			console.log("thead")
			console.log(children);
			return <thead className="font-inter text-xs">{children}</thead>;
		},
		td: ({ children }) => {
			console.log("td")
			console.log(children);
			return <td className="font-inter text-xs">{children}</td>;
		},
		tr: ({ children }) => {
			console.log("tr")
			console.log(children);
			return <tr className="space-x-2 font-inter text-xs">{children}</tr>;
		},
	}

	if (role === "assistant") {
		return (
			<div className="flex items-start gap-2">
				<Avatar className="border items-center justify-center p-2 size-6 font-inter text-xs">
					<AvatarFallback>S</AvatarFallback>
				</Avatar>
				<div className="flex flex-col gap-2">
					<Markdown components={components} remarkPlugins={[remarkGfm]}>{content}</Markdown>
				</div>
			</div>
		);
	} else {
		return (
			<div className="flex items-start gap-2">
				<Avatar className="border items-center justify-center p-2 size-6 font-messi text-xs">
					<AvatarFallback>SS</AvatarFallback>
				</Avatar>
				<div className="font-inter tracking-tight font-bold text-sm">
					<Markdown>{content}</Markdown>
				</div>
			</div>
		);
	}
});

// Add display name for debugging
ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;
