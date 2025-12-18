import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TraceItem } from '../types';

interface TracingCanvasProps {
  item: TraceItem;
  onComplete: (success: boolean) => void;
  onBack: () => void;
}

export const TracingCanvas: React.FC<TracingCanvasProps> = ({ item, onComplete, onBack }) => {
  const userCanvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showError, setShowError] = useState(false);

  // Colors
  const STROKE_COLOR = '#3B82F6'; // Blue-500
  const LINE_WIDTH = 25; // Thicker line for easier tracing

  // Helper to calculate optimal font size
  const getOptimalFont = (ctx: CanvasRenderingContext2D, text: string, width: number, height: number) => {
    let fontSize = Math.min(width, height) * 0.6;
    ctx.font = `bold ${fontSize}px "Fredoka", sans-serif`;
    
    const metrics = ctx.measureText(text);
    if (metrics.width > width * 0.85) {
      fontSize = fontSize * ((width * 0.85) / metrics.width);
    }
    return `bold ${fontSize}px "Fredoka", sans-serif`;
  };

  const initCanvases = useCallback(() => {
    const userCanvas = userCanvasRef.current;
    const guideCanvas = guideCanvasRef.current;
    const container = containerRef.current;
    if (!userCanvas || !guideCanvas || !container) return;

    // Set resolution based on container size
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    userCanvas.width = width;
    userCanvas.height = height;
    guideCanvas.width = width;
    guideCanvas.height = height;

    // --- Setup Guide Canvas ---
    const gCtx = guideCanvas.getContext('2d');
    if (gCtx) {
      gCtx.clearRect(0, 0, width, height);
      gCtx.textAlign = 'center';
      gCtx.textBaseline = 'middle';
      
      const font = getOptimalFont(gCtx, item.label, width, height);
      gCtx.font = font;

      // Draw dashed guide
      gCtx.save();
      gCtx.setLineDash([15, 15]);
      gCtx.strokeStyle = '#D1D5DB'; // Gray-300
      gCtx.lineWidth = 4;
      gCtx.strokeText(item.label, width / 2, height / 2);
      
      // Light fill for visibility
      gCtx.fillStyle = '#F3F4F6'; // Gray-100
      gCtx.fillText(item.label, width / 2, height / 2);
      gCtx.restore();
    }

    // --- Setup User Canvas ---
    const uCtx = userCanvas.getContext('2d');
    if (uCtx) {
      uCtx.clearRect(0, 0, width, height);
      uCtx.lineCap = 'round';
      uCtx.lineJoin = 'round';
      uCtx.lineWidth = LINE_WIDTH;
      uCtx.strokeStyle = STROKE_COLOR;
    }
    
    setShowError(false);
  }, [item.label]);

  useEffect(() => {
    initCanvases();
    // Small delay to ensure fonts are loaded/layout is settled
    const timer = setTimeout(initCanvases, 100);
    window.addEventListener('resize', initCanvases);
    return () => {
      window.removeEventListener('resize', initCanvases);
      clearTimeout(timer);
    };
  }, [initCanvases]);

  const getCoordinates = (event: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    const canvas = userCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (showError) return; // Disable input during error animation
    e.preventDefault(); 
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = userCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = userCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = userCanvasRef.current?.getContext('2d');
    ctx?.closePath();
  };

  const validateTracing = () => {
    const userCanvas = userCanvasRef.current;
    if (!userCanvas) return false;

    // Create a temporary offscreen canvas to render the solid target
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = userCanvas.width;
    targetCanvas.height = userCanvas.height;
    const tCtx = targetCanvas.getContext('2d');
    if (!tCtx) return false;

    // Draw solid black text (the perfect trace)
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillStyle = '#000000';
    tCtx.font = getOptimalFont(tCtx, item.label, userCanvas.width, userCanvas.height);
    tCtx.fillText(item.label, userCanvas.width / 2, userCanvas.height / 2);

    // Get pixel data
    // Optimisation: We could sample fewer pixels, but for a single check this is fine on modern devices
    const width = userCanvas.width;
    const height = userCanvas.height;
    
    let uCtx = userCanvas.getContext('2d');
    if (!uCtx) return false;

    const userData = uCtx.getImageData(0, 0, width, height).data;
    const targetData = tCtx.getImageData(0, 0, width, height).data;

    let targetPixels = 0;
    let coveredPixels = 0;
    
    // Check pixels (step by 4 because RGBA)
    // Optimization: check every 4th pixel (step by 16) to speed up loop
    for (let i = 0; i < targetData.length; i += 16) {
      // If this pixel is part of the target text (Alpha > 128)
      if (targetData[i + 3] > 128) {
        targetPixels++;
        // Check if user drew here (Alpha > 128)
        if (userData[i + 3] > 64) {
          coveredPixels++;
        }
      }
    }

    if (targetPixels === 0) return true; // Should not happen

    const coverage = coveredPixels / targetPixels;
    console.log(`Tracing Accuracy: ${(coverage * 100).toFixed(1)}%`);

    // Threshold: User must cover at least 25% of the letter to "pass"
    // This allows for sloppy toddler tracing while catching "empty" or "scribble outside" attempts
    return coverage > 0.25; 
  };

  const handleCheck = () => {
    const success = validateTracing();

    if (success) {
      onComplete(true);
    } else {
      setShowError(true);
      // Wait for animation then reset and notify parent
      setTimeout(() => {
        setShowError(false);
        onComplete(false); // Play "Try again" audio
        
        // Optional: Clear canvas automatically on fail? 
        // Let's keep it so they can add to it, or clear it manually. 
        // Actually, clearing it gives a fresh start which is often less confusing.
        // initCanvases(); 
      }, 1500);
    }
  };

  const handleClear = () => {
    const userCanvas = userCanvasRef.current;
    if (userCanvas) {
      const ctx = userCanvas.getContext('2d');
      ctx?.clearRect(0, 0, userCanvas.width, userCanvas.height);
    }
    setShowError(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-yellow-50 shadow-sm">
        <button 
          onClick={onBack}
          className="bg-gray-200 p-3 rounded-full hover:bg-gray-300 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h2 className="text-3xl font-bold text-gray-700 font-hand">Trace: {item.label}</h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 p-4 relative flex items-center justify-center bg-dots-pattern">
        <div 
          ref={containerRef} 
          className="w-full h-full max-w-2xl max-h-[70vh] bg-white rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)] border-4 border-dashed border-blue-200 relative overflow-hidden touch-none"
        >
            {/* Guide Layer (Bottom) */}
            <canvas
              ref={guideCanvasRef}
              className="absolute inset-0 pointer-events-none"
            />
            
            {/* User Drawing Layer (Top) */}
            <canvas
              ref={userCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 cursor-crosshair active:cursor-crosshair"
            />

            {/* Error Overlay */}
            {showError && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-full p-8 shadow-2xl border-4 border-red-100 transform animate-bounce">
                  <svg className="w-32 h-32 text-red-500 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-100 flex gap-4 justify-center pb-8">
        <button
          onClick={handleClear}
          disabled={showError}
          className="px-8 py-4 rounded-2xl bg-red-100 text-red-500 font-bold text-xl hover:bg-red-200 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear
        </button>
        <button
          onClick={handleCheck}
          disabled={showError}
          className="px-12 py-4 rounded-2xl bg-green-500 text-white font-bold text-2xl shadow-lg shadow-green-200 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          I'm Done!
        </button>
      </div>
    </div>
  );
};