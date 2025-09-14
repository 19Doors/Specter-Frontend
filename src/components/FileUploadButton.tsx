"use client"
import { useFileUpload } from "@/hooks/useFileUpload";
import { ReactNode } from 'react';

interface FileUpload {
	accept: string,
	children: ReactNode,
	className?: string
}

export function FileUploadButton({ accept, children, className }: FileUpload) {
	const { fileInputRef, handleFilesButton, handleFileChange } = useFileUpload();

	return (
		<div className="">
			<input
				ref={fileInputRef}
				type='file'
				accept={accept}
				onChange={handleFileChange}
				hidden
				multiple
			/>
			<p
				onClick={handleFilesButton} className={className}
			>
				{children}
			</p>
		</div>
	);
}
