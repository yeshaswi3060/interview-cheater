import React, { useState, useRef, useEffect } from 'react';

interface SnippingToolProps {
    imageSrc: string;
    onCrop: (croppedImage: string) => void;
    onCancel: () => void;
}

const SnippingTool: React.FC<SnippingToolProps> = ({ imageSrc, onCrop, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            setImage(img);
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                draw(img, { x: 0, y: 0 }, { x: 0, y: 0 });
            }
        };
    }, [imageSrc]);

    const draw = (img: HTMLImageElement, start: { x: number, y: number }, end: { x: number, y: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw original image (scaled to fit if necessary, but here we assume full screen capture matches window)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate selection rect
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);

        if (width > 0 && height > 0) {
            // Clear selection area to show underlying image
            ctx.clearRect(x, y, width, height);
            ctx.drawImage(img, x, y, width, height, x, y, width, height);

            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        const x = e.clientX - (rect?.left || 0);
        const y = e.clientY - (rect?.top || 0);
        setStartPos({ x, y });
        setCurrentPos({ x, y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !image) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        const x = e.clientX - (rect?.left || 0);
        const y = e.clientY - (rect?.top || 0);
        setCurrentPos({ x, y });
        draw(image, startPos, { x, y });
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleConfirm = () => {
        if (!image || !canvasRef.current) return;

        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(currentPos.x - startPos.x);
        const height = Math.abs(currentPos.y - startPos.y);

        if (width === 0 || height === 0) {
            alert('Please select an area first.');
            return;
        }

        // Calculate scaling ratio between displayed canvas and actual image
        // The canvas size is window.innerWidth/Height
        // The image size is the actual screenshot resolution (likely higher due to DPI)
        const scaleX = image.naturalWidth / canvasRef.current.width;
        const scaleY = image.naturalHeight / canvasRef.current.height;

        const tempCanvas = document.createElement('canvas');
        // Set temp canvas size to the actual resolution of the selected area
        tempCanvas.width = width * scaleX;
        tempCanvas.height = height * scaleY;
        const ctx = tempCanvas.getContext('2d');

        // Draw the selected portion of the original image to the temp canvas
        // We map the selection coordinates (canvas space) to image coordinates (image space)
        ctx?.drawImage(
            image,
            x * scaleX,
            y * scaleY,
            width * scaleX,
            height * scaleY,
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
        );

        onCrop(tempCanvas.toDataURL());
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            cursor: 'crosshair'
        }}>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ display: 'block' }}
            />
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '10px',
                zIndex: 10000
            }}>
                <button onClick={handleConfirm} style={buttonStyle}>CONFIRM SELECTION</button>
                <button onClick={onCancel} style={cancelButtonStyle}>CANCEL</button>
            </div>
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
};

const cancelButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: '#333',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
};

export default SnippingTool;
