
import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onSign: (dataUrl: string) => void;
  onClear: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSign, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSign(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
    }
    onClear();
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden relative group">
        <canvas 
          ref={canvasRef}
          width={500}
          height={200}
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={endDrawing}
          onTouchMove={draw}
          className="w-full cursor-crosshair touch-none"
        />
        <div className="absolute top-2 right-2 flex space-x-2">
          <button 
            onClick={clear}
            className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition shadow-sm"
          >
            <i className="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          Sign Here Digital ID
        </div>
      </div>
      <p className="text-[10px] text-slate-400 italic text-center">
        By signing above, you certify this electronic signature is a binding legal notice per the Uniform Electronic Transactions Act (UETA).
      </p>
    </div>
  );
};

export default SignaturePad;
