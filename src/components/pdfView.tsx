import React, { useCallback, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PageDimensions {
	originalWidth: number;
	originalHeight: number;
	renderedWidth: number;
	renderedHeight: number;
}

interface BoundingBox {
	x: number;
	y: number;
	width: number;
	height: number;
	pageNumber: number;
	id?: string;
	label?: string;
	confidence?: number;
	color?: string;
}

interface PdfViewerProps {
	pdfBase64: string;
	boundingBoxes: BoundingBox[];
	onBoxClick?: (box: BoundingBox) => void;
}

const PdfViewerWithBoxes: React.FC<PdfViewerProps> = ({ pdfBase64, boundingBoxes, onBoxClick }) => {
	console.log(boundingBoxes)
	const [numPages, setNumPages] = useState<number>();
	// const [pageNumber, setPageNumber] = useState<number>(1);
	const [pageDimensions, setPageDimensions] = useState<Record<number, PageDimensions>>({});
	const pageRefs = useRef<Record<number, HTMLDivElement>>({});
	const [scale, setScale] = useState(1.0);

	const onPageLoadSuccess = useCallback((page: any, pageNumber: number) => {
		const { originalWidth, originalHeight } = page;
		const pageElement = pageRefs.current[pageNumber];

		if (pageElement) {
			const canvas = pageElement.querySelector('canvas');
			if (canvas) {
				setPageDimensions(prev => ({
					...prev,
					[pageNumber]: {
						originalWidth,
						originalHeight,
						renderedWidth: canvas.width / window.devicePixelRatio,
						renderedHeight: canvas.height / window.devicePixelRatio
					}
				}));
			}
		}
	}, []);

	const renderBoundingBoxes = (pageNumber: number) => {
		const pageBoxes = boundingBoxes.filter(box => box.pageNumber === pageNumber);
		const dimensions = pageDimensions[pageNumber];

		if (!dimensions || pageBoxes.length === 0) return null;

		return pageBoxes.map((box, index) => {
			// Convert normalized coordinates (0-1) to actual pixels
			const actualX = box.x * dimensions.renderedWidth;
			const actualY = box.y * dimensions.renderedHeight;
			const actualWidth = box.width * dimensions.renderedWidth;
			const actualHeight = box.height * dimensions.renderedHeight;

			return (
				<div
					key={box.id || `box-${pageNumber}-${index}`}
					className={`
          absolute border-3 cursor-pointer p-2 rounded-xs hover:bg-yellow-500
          ${box.color}
        `}
					style={{
						left: `${actualX}px`,
						top: `${actualY}px`,
						width: `${actualWidth}px`,
						height: `${actualHeight}px`,
					}}
					onClick={() => onBoxClick?.(box)}
				 />
				// </div>
			);
		});
	};

	function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
		setNumPages(numPages);
	}
	return (
		<div className="w-full h-screen overflow-auto bg-gray-100">
			{/* Controls */}
			<div className="sticky top-0 z-20 bg-white shadow-sm p-4 flex items-center gap-4">
				<div className="flex items-center gap-2">
					<button
						onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))}
						className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
					>
						-
					</button>
					<span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
					<button
						onClick={() => setScale(prev => Math.min(3, prev + 0.25))}
						className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
					>
						+
					</button>
				</div>

				<div className="text-sm text-gray-600">
					{boundingBoxes.length} annotations
				</div>
			</div>

			<div className="flex-1 h-full overflow-auto">
				<Document
					file={pdfBase64}
					onLoadSuccess={onDocumentLoadSuccess}
					className="flex flex-col items-center gap-4 p-4"
				>
					{Array.from(new Array(numPages), (el, index) => {
						const pageNumber = index + 1;
						return (
							<div
								key={`page_${pageNumber}`}
								className="relative shadow-lg"
								ref={(el) => {
									if (el) pageRefs.current[pageNumber] = el;
								}}
							>
								<Page
									pageNumber={pageNumber}
									scale={scale}
									onLoadSuccess={(page) => onPageLoadSuccess(page, pageNumber)}
									className="relative"
								/>

								{/* Bounding boxes overlay */}
								<div className="absolute top-0 left-0 w-full h-full pointer-events-none">
									<div className="relative w-full h-full pointer-events-auto">
										{renderBoundingBoxes(pageNumber)}
									</div>
								</div>
							</div>
						);
					})}
				</Document>
			</div>
		</div>
	);
};

export default PdfViewerWithBoxes;
