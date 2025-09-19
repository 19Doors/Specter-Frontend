import type { Metadata } from "next";
import "./globals.css";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ReactLenis, useLenis } from 'lenis/react'
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SpecSidebar } from "@/components/sidebar";

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
				className={`min-h-screen`}
			>
				{children}
			</body>
		</html>
	);
}
