import type { Metadata } from "next";
import "./globals.css";
import { ReactLenis, useLenis } from 'lenis/react'

export const metadata: Metadata = {
	title: "Spector",
	description: "Spector",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {

	return (
		<html lang="en">
			<body
				className={``}
			>
				{children}
			</body>
		</html>
	);
}
