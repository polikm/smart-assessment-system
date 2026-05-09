import { useEffect, useRef, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import { renderPoster, exportPoster, posterTemplates, type PosterData } from '../utils/posterCanvas';

interface AdmissionPosterProps {
  data: PosterData;
  templateId?: string;
  onClose: () => void;
}

export default function AdmissionPoster({
  data,
  templateId = 'academic',
  onClose,
}: AdmissionPosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = 400;
    const displayHeight = 560;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    renderPoster(canvas, templateId, data);
  }, [data, templateId]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = exportPoster(canvas);
    const link = document.createElement('a');
    link.download = `录取通知书_${data.studentName}.png`;
    link.href = dataUrl;
    link.click();
  }, [data.studentName]);

  const template = posterTemplates.find((t) => t.id === templateId) || posterTemplates[0];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center z-10 hover:bg-slate-100 transition-colors"
        >
          <X size={18} className="text-slate-600" />
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-4">
          <canvas
            ref={canvasRef}
            className="rounded-xl"
            style={{ width: '400px', height: '560px' }}
          />

          <div className="flex items-center justify-between mt-4 px-2">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: template.primaryColor }}
              />
              <span className="text-sm text-slate-600">{template.name}风格</span>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Download size={16} />
              保存图片
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
