"use client"
import { Button } from "@/components/ui/button";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap"
import { authClient } from "@/lib/auth-client";

gsap.registerPlugin(useGSAP);

export default function Login() {
	const buttonRef = useRef(null);

	const { contextSafe } = useGSAP(() => {
	});

	// Make event handlers context-safe
	const hoverAction = contextSafe(() => {
		gsap.to(buttonRef.current, {
			backgroundColor: "#000000",
			color: "#FFFFFF",
			duration: 0.1,
			ease: "power1.inOut"
		});
	});

	const hoverLeave = contextSafe(() => {
		gsap.to(buttonRef.current, {
			backgroundColor: "transparent",
			color: "#0a0a0a",
			duration: 0.1,
			ease: "power1.inOut"
		});
	});

	const onClick = async () => {
		await authClient.signIn.social({
			provider: "google",
			callbackURL: "/"
		});
	}

	return (
		<div className="w-full h-screen flex justify-center items-center flex-col gap-4">
			{/* <h1 className="font-merri font-bold text-2xl max-w-1/2 text-center">Understanding your rights is the first step to protecting them.</h1> */}
			<Button
				ref={buttonRef}
				variant="default"
				className="outline-none text-lg p-10 py-6 text-foreground border-1 border-color3 rounded-xs font-inter font-bold bg-background"
				size="lg"
				onPointerEnter={hoverAction}
				onPointerLeave={hoverLeave}
				onClick={onClick}
			>
				Login with Google
			</Button>
		</div>
	);
}
