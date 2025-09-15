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
		if (typeof children === 'string' && children.trim()) {
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
	const getTextContent = (node) => {
		if (typeof node === 'string') {
			return node;
		}
		if (typeof node === 'number') {
			return node.toString();
		}
		if (Array.isArray(node)) {
			return node.map(getTextContent).join('');
		}
		if (node && typeof node === 'object' && node.props && node.props.children) {
			return getTextContent(node.props.children);
		}
		return '';
	};

	const components = {
		p: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<AnimatedText element="p" className="font-inter text-sm mb-2">
					{textContent}
				</AnimatedText>
			);
		},

		ul: ({ children }) => (
			<ul className="font-inter text-sm flex flex-col gap-1 mb-2 ml-4">
				{children}
			</ul>
		),

		li: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<li className="font-inter text-sm list-disc">
					<AnimatedText element="span" className="font-inter text-sm">
						{textContent}
					</AnimatedText>
				</li>
			);
		},

		strong: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<AnimatedText element="strong" className="font-inter text-sm font-bold">
					{textContent}
				</AnimatedText>
			);
		},

		table: ({ children }) => (
			<div className="overflow-x-auto my-4">
				<table className="min-w-full border-collapse border border-color2 font-inter text-sm">
					{children}
				</table>
			</div>
		),

		thead: ({ children }) => (
			<thead className="bg-color2">
				{children}
			</thead>
		),

		tbody: ({ children }) => (
			<tbody>
				{children}
			</tbody>
		),

		tr: ({ children }) => (
			<tr className="border-b border-color2">
				{children}
			</tr>
		),

		th: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<th className="border border-color3 px-4 py-2 text-left font-semibold bg-color2">
					<AnimatedText element="span" className="font-inter text-xs font-bold">
						{textContent}
					</AnimatedText>
				</th>
			);
		},

		td: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<td className="border border-color3 px-4 py-2">
					<AnimatedText element="span" className="font-inter text-xs">
						{textContent}
					</AnimatedText>
				</td>
			);
		},

		h1: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<AnimatedText element="h1" className="font-inter text-xl font-bold mb-4">
					{textContent}
				</AnimatedText>
			);
		},

		h2: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<AnimatedText element="h2" className="font-inter text-lg font-bold mb-3">
					{textContent}
				</AnimatedText>
			);
		},

		h3: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<AnimatedText element="h3" className="font-inter text-md font-bold mb-2">
					{textContent}
				</AnimatedText>
			);
		},

		em: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<AnimatedText element="em" className="font-inter text-sm italic">
					{textContent}
				</AnimatedText>
			);
		},

		code: ({ children }) => {
			const textContent = getTextContent(children);
			return (
				<code className="bg-gray-100 px-1 rounded font-mono text-sm">
					{textContent}
				</code>
			);
		},

		blockquote: ({ children }) => (
			<blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
				{children}
			</blockquote>
		),
	};
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
