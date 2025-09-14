import { useRef } from 'react';
import { create } from 'zustand';

export const useFilesChat = create<{
	files: FileList | null;
	setFiles: (f: FileList) => void;
}>((set) => ({
	files: null,
	setFiles: (f: FileList) => set({ files: f })
}));

export function useFileUpload() {
	const fileInputRef = useRef<HTMLInputElement>(null);


	const handleFilesButton = (e: React.MouseEvent<HTMLParagraphElement, MouseEvent>) => {
		e.preventDefault();
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			console.log('Selected files:', files);
			useFilesChat.getState().setFiles(files);
			// const c = useFilesChat((state) => { state.setFiles(files) });
			// Add your file processing logic here
		}
	};

	return {
		fileInputRef,
		handleFilesButton,
		handleFileChange
	};
}
