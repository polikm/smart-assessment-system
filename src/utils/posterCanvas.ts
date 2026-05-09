export interface PosterData {
  studentName: string;
  courseTypeName: string;
  level: string;
  score: number;
  schoolName: string;
  date: string;
  phone?: string;
}

export interface PosterTemplate {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  borderStyle: string;
  fontFamily: string;
  schoolName: string;
}

export const posterTemplates: PosterTemplate[] = [
  {
    id: 'academic',
    name: '学术典雅',
    primaryColor: '#8B1A1A',
    secondaryColor: '#D4AF37',
    accentColor: '#F5F5DC',
    bgColor: '#FFFAF0',
    textColor: '#2C1810',
    borderStyle: 'ornate',
    fontFamily: 'serif',
    schoolName: '未来科技学院',
  },
  {
    id: 'tech',
    name: '科技现代',
    primaryColor: '#0F4C75',
    secondaryColor: '#C0C0C0',
    accentColor: '#E8F4F8',
    bgColor: '#F0F4F8',
    textColor: '#1A1A2E',
    borderStyle: 'geometric',
    fontFamily: 'sans-serif',
    schoolName: '未来科技学院',
  },
  {
    id: 'nature',
    name: '自然成长',
    primaryColor: '#1B5E20',
    secondaryColor: '#F9A825',
    accentColor: '#E8F5E9',
    bgColor: '#F1F8E9',
    textColor: '#1B5E20',
    borderStyle: 'organic',
    fontFamily: 'cursive',
    schoolName: '未来科技学院',
  },
];

function drawOrnateBorder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  ctx.lineWidth = 1;
  ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);

  const corners = [
    [x, y], [x + w, y], [x, y + h], [x + w, y + h],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function drawGeometricBorder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);

  const size = 12;
  const positions = [
    [x, y], [x + w - size, y], [x, y + h - size], [x + w - size, y + h - size],
  ];
  positions.forEach(([px, py]) => {
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
  });
}

function drawOrganicBorder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + w - 20, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
  ctx.lineTo(x + w, y + h - 20);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
  ctx.lineTo(x + 20, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
  ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x, y, x + 20, y);
  ctx.closePath();
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 26, y + 6);
  ctx.lineTo(x + w - 26, y + 6);
  ctx.quadraticCurveTo(x + w - 6, y + 6, x + w - 6, y + 26);
  ctx.lineTo(x + w - 6, y + h - 26);
  ctx.quadraticCurveTo(x + w - 6, y + h - 6, x + w - 26, y + h - 6);
  ctx.lineTo(x + 26, y + h - 6);
  ctx.quadraticCurveTo(x + 6, y + h - 6, x + 6, y + h - 26);
  ctx.lineTo(x + 6, y + 26);
  ctx.quadraticCurveTo(x + 6, y + 6, x + 26, y + 6);
  ctx.closePath();
  ctx.stroke();
}

function drawDecorativePattern(ctx: CanvasRenderingContext2D, template: PosterTemplate, width: number, y: number) {
  if (template.id === 'academic') {
    ctx.strokeStyle = template.secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.2, y);
    ctx.lineTo(width * 0.8, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.3, y + 4);
    ctx.lineTo(width * 0.7, y + 4);
    ctx.stroke();
  } else if (template.id === 'tech') {
    ctx.fillStyle = template.primaryColor;
    for (let i = 0; i < 5; i++) {
      const x = width * 0.25 + i * width * 0.125;
      ctx.fillRect(x - 8, y - 2, 16, 4);
    }
  } else if (template.id === 'nature') {
    ctx.strokeStyle = template.secondaryColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x = width * 0.2 + i * width * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function renderPoster(
  canvas: HTMLCanvasElement,
  templateId: string,
  data: PosterData
): void {
  const template = posterTemplates.find((t) => t.id === templateId) || posterTemplates[0];
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = template.bgColor;
  ctx.fillRect(0, 0, width, height);

  const margin = 30;
  const borderW = width - margin * 2;
  const borderH = height - margin * 2;

  if (template.borderStyle === 'ornate') {
    drawOrnateBorder(ctx, margin, margin, borderW, borderH, template.primaryColor);
  } else if (template.borderStyle === 'geometric') {
    drawGeometricBorder(ctx, margin, margin, borderW, borderH, template.primaryColor);
  } else {
    drawOrganicBorder(ctx, margin, margin, borderW, borderH, template.primaryColor);
  }

  let y = margin + 40;

  ctx.fillStyle = template.primaryColor;
  ctx.font = `bold 16px ${template.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText(data.schoolName || template.schoolName, width / 2, y);

  y += 35;
  drawDecorativePattern(ctx, template, width, y);

  y += 30;
  ctx.fillStyle = template.primaryColor;
  ctx.font = `bold 32px ${template.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('录取通知书', width / 2, y);

  y += 25;
  drawDecorativePattern(ctx, template, width, y);

  y += 40;
  ctx.fillStyle = template.textColor;
  ctx.font = `16px ${template.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText(`恭喜 ${data.studentName || '同学'} 同学`, width / 2, y);

  y += 35;
  ctx.font = `14px sans-serif`;
  ctx.fillStyle = '#666';
  ctx.fillText('经综合测评，您已被录取至', width / 2, y);

  y += 40;
  const levelColors: Record<string, string> = {
    A: '#059669',
    B: '#2563EB',
    C: '#D97706',
    D: '#6B7280',
  };
  ctx.fillStyle = levelColors[data.level] || template.primaryColor;
  ctx.font = `bold 22px ${template.fontFamily}`;
  ctx.fillText(`${data.courseTypeName || '科技'} ${data.level || 'B'}级班`, width / 2, y);

  y += 35;
  ctx.fillStyle = template.secondaryColor;
  ctx.font = `bold 14px sans-serif`;
  ctx.fillText(`测评得分：${data.score || 0}分`, width / 2, y);

  y += 40;
  drawDecorativePattern(ctx, template, width, y);

  y += 30;
  ctx.fillStyle = '#666';
  ctx.font = `13px sans-serif`;
  ctx.textAlign = 'left';
  const infoX = width * 0.2;
  ctx.fillText(`报到日期：${data.date || new Date().toLocaleDateString('zh-CN')}`, infoX, y);

  y += 28;
  ctx.fillText(`联系电话：${data.phone || '400-888-8888'}`, infoX, y);

  y += 28;
  ctx.fillText('校区地址：请咨询招生老师', infoX, y);

  y += 50;
  ctx.textAlign = 'center';
  ctx.fillStyle = template.primaryColor;
  ctx.font = `bold 15px ${template.fontFamily}`;
  ctx.fillText(data.schoolName || template.schoolName, width / 2, y);

  y += 22;
  ctx.fillStyle = '#999';
  ctx.font = `12px sans-serif`;
  ctx.fillText('期待您的到来，开启科技学习之旅', width / 2, y);
}

export function exportPoster(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png', 1.0);
}

export function createPosterBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png', 1.0);
  });
}
