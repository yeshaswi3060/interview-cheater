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
    const [scale, setScale] = useState({ x: 1, y: 1 });

    useEffect(() => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            setImage(img);
            if (canvasRef.current) {
                // Use actual screen dimensions
                const screenWidth = window.screen.width;
                const screenHeight = window.screen.height;

                canvasRef.current.width = screenWidth;
                canvasRef.current.height = screenHeight;

                // Calculate scale between image and canvas
                // This handles DPI scaling differences
                const scaleX = img.naturalWidth / screenWidth;
                const scaleY = img.naturalHeight / screenHeight;
                setScale({ x: scaleX, y: scaleY });

                draw(img, { x: 0, y: 0 }, { x: 0, y: 0 }, scaleX, scaleY);
            }
        };
    }, [imageSrc]);

    const draw = (
        img: HTMLImageElement,
        start: { x: number, y: number },
        end: { x: number, y: number },
        scaleX: number = scale.x,
        scaleY: number = scale.y
    ) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw image scaled to canvas size
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Selection rect
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);

        if (width > 0 && height > 0) {
            // Clear selection to show image
            ctx.clearRect(x, y, width, height);
            ctx.drawImage(img,
                x * scaleX, y * scaleY, width * scaleX, height * scaleY,
                x, y, width, height
            );

            // White border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Corner handles
            const handleSize = 8;
            ctx.fillStyle = '#fff';
            [[x, y], [x + width, y], [x, y + height], [x + width, y + height]].forEach(([hx, hy]) => {
                ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
            });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const x = e.clientX;
        const y = e.clientY;
        setStartPos({ x, y });
        setCurrentPos({ x, y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !image) return;
        const x = e.clientX;
        const y = e.clientY;
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

        if (width < 10 || height < 10) {
            alert('Please select a larger area.');
            return;
        }

        // Create cropped image at original resolution
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width * scale.x;
        tempCanvas.height = height * scale.y;
        const ctx = tempCanvas.getContext('2d');

        ctx?.drawImage(
            image,
            x * scale.x,
            y * scale.y,
            width * scale.x,
            height * scale.y,
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
        );

        onCrop(tempCanvas.toDataURL('image/png'));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            cursor: 'crosshair',
            background: '#000'
        }}>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    display: 'block',
                    width: '100vw',
                    height: '100vh'
                }}
            />

            {/* Instructions */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                pointerEvents: 'none'
            }}>
                Click and drag to select area
            </div>

            {/* Buttons */}
            <div style={{
                position: 'absolute',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '12px',
                zIndex: 10000
            }}>
                <button onClick={handleConfirm} style={buttonStyle}>✓ CONFIRM</button>
                <button onClick={onCancel} style={cancelButtonStyle}>✕ CANCEL</button>
            </div>
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '25px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
};

const cancelButtonStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '25px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
};

export default SnippingTool;
