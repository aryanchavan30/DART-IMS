import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface SignaturePadProps {
  width?: number;
  height?: number;
}

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => string | null;
  isEmpty: () => boolean;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ width = 450, height = 200 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const isEmptyRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getCoords = (event: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (event instanceof MouseEvent) {
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        }
        if (event.touches && event.touches.length > 0) {
            return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
        }
        return { x: 0, y: 0 };
    };

    const startDrawing = (event: MouseEvent | TouchEvent) => {
        event.preventDefault();
        const { x, y } = getCoords(event);
        ctx.beginPath();
        ctx.moveTo(x, y);
        isDrawingRef.current = true;
        isEmptyRef.current = false;
    };

    const draw = (event: MouseEvent | TouchEvent) => {
        if (!isDrawingRef.current) return;
        event.preventDefault();
        const { x, y } = getCoords(event);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
        ctx.closePath();
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);

        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [width, height]);
  
  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          isEmptyRef.current = true;
        }
      }
    },
    getSignature: () => {
      if (isEmptyRef.current) return null;
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL('image/png') : null;
    },
    isEmpty: () => isEmptyRef.current,
  }));

  return (
    <canvas
      ref={canvasRef}
      className="border border-slate-300 rounded-md bg-white touch-none"
    />
  );
});

SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;
