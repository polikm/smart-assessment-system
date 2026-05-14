import { jsPDF } from 'jspdf';

interface PDFReportData {
  studentName: string;
  school: string;
  grade: string;
  examName: string;
  examDate: string;
  score: number;
  level: string;
  correctRate: number;
  duration: number;
  dimensionScores: Record<string, number>;
  knowledgeStats: Record<string, { correct: number; total: number }>;
  aiAnalysis: {
    knowledgeAnalysis?: string;
    logicAbility?: string;
    potential?: string;
    weakPoints?: string;
    strengths?: string;
    development?: string;
  };
  learningPlan: {
    shortTerm?: string;
    mediumTerm?: string;
    longTerm?: string;
    resources?: string[];
  };
  classRecommendation: {
    className?: string;
    reason?: string;
    path?: string[];
  };
  radarChartImage?: string;
  trendChartImage?: string;
  answerDetails?: Array<{
    sequence: number;
    knowledgePoint: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    score: number;
  }>;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#1e293b',
  textLight: '#64748b',
  bg: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
};

const DIMENSION_LABELS: Record<string, string> = {
  cognitive: '认知能力',
  skill: '技能能力',
  quality: '综合素养',
  innovation: '创新思维',
  collaboration: '协作沟通',
  ethics: 'AI伦理',
};

const DIMENSION_COLORS: Record<string, string> = {
  cognitive: '#3b82f6',
  skill: '#22c55e',
  quality: '#f59e0b',
  innovation: '#8b5cf6',
  collaboration: '#ec4899',
  ethics: '#14b8a6',
};

async function loadChineseFont(doc: jsPDF): Promise<boolean> {
  try {
    const response = await fetch('/fonts/simhei-base64.txt');
    if (!response.ok) {
      console.warn('Font file not found in public/fonts');
      return false;
    }
    const base64 = await response.text();
    doc.addFileToVFS('simhei.ttf', base64);
    doc.addFont('simhei.ttf', 'SimHei', 'normal');
    doc.addFont('simhei.ttf', 'SimHei', 'bold');
    console.log('[PDF] Chinese font loaded successfully');
    return true;
  } catch (e) {
    console.warn('[PDF] Failed to load Chinese font:', e);
    return false;
  }
}

export async function generateReportPDF(data: PDFReportData): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');

  const fontLoaded = await loadChineseFont(doc);
  const fontName = fontLoaded ? 'SimHei' : 'helvetica';

  const pageWidth = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const pageHeight = 297;
  const footerY = 285;

  let y = 10;
  let pageNum = 1;

  const drawText = (text: string, x: number, yPos: number, options: any = {}) => {
    doc.setFontSize(options.size || 10);
    doc.setTextColor(options.color || COLORS.text);
    if (options.bold) {
      doc.setFont(fontName, 'bold');
    } else {
      doc.setFont(fontName, 'normal');
    }
    doc.text(text, x, yPos, { align: options.align || 'left' });
  };

  const drawRect = (x: number, yPos: number, w: number, h: number, color: string, radius: number = 2) => {
    doc.setFillColor(color);
    doc.roundedRect(x, yPos, w, h, radius, radius, 'F');
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string = COLORS.border) => {
    doc.setDrawColor(color);
    doc.setLineWidth(0.3);
    doc.line(x1, y1, x2, y2);
  };

  const checkPageBreak = (requiredHeight: number = 20) => {
    if (y + requiredHeight > footerY - 10) {
      addPage();
    }
  };

  const addPage = () => {
    doc.addPage();
    pageNum++;
    y = 15;
    drawPageHeader();
  };

  const drawPageHeader = () => {
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight);
    doc.setFont(fontName, 'normal');
    doc.text(`AI编程能力测评报告 - 第${pageNum}页`, pageWidth / 2, 10, { align: 'center' });
    drawLine(margin, 12, pageWidth - margin, 12);
  };

  const drawFooter = () => {
    drawLine(margin, footerY, pageWidth - margin, footerY);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight);
    doc.setFont(fontName, 'normal');
    doc.text('本报告由AI智能分析生成，仅供参考', pageWidth / 2, footerY + 5, { align: 'center' });
  };

  // ========== 第1页：标题 + 学生信息 + 核心数据 ==========

  // 头部标题
  drawRect(margin, y, contentWidth, 14, COLORS.primary, 3);
  drawText('AI编程能力测评报告', pageWidth / 2, y + 9, { size: 14, bold: true, color: COLORS.white, align: 'center' });
  y += 18;

  // 学生信息
  drawText(`学生：${data.studentName || '-'}`, margin, y, { size: 9, color: COLORS.textLight });
  drawText(`学校：${data.school || '-'}`, margin + 50, y, { size: 9, color: COLORS.textLight });
  drawText(`年级：${data.grade || '-'}`, margin + 100, y, { size: 9, color: COLORS.textLight });
  drawText(`测评：${data.examName || '-'}`, margin + 140, y, { size: 9, color: COLORS.textLight });
  y += 6;
  drawText(`时间：${data.examDate || '-'}`, margin, y, { size: 9, color: COLORS.textLight });
  y += 8;
  drawLine(margin, y, pageWidth - margin, y);
  y += 6;

  // 核心数据区（4列）
  const cardWidth = (contentWidth - 9) / 4;
  const cards = [
    { label: '总分', value: `${data.score}`, color: COLORS.primary },
    { label: '等级', value: data.level || '-', color: getLevelColor(data.level) },
    { label: '正确率', value: `${data.correctRate}%`, color: COLORS.success },
    { label: '用时', value: formatDuration(data.duration), color: COLORS.warning },
  ];

  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + 3);
    drawRect(x, y, cardWidth, 18, COLORS.bg, 2);
    drawText(card.value, x + cardWidth / 2, y + 7, { size: 12, bold: true, color: card.color, align: 'center' });
    drawText(card.label, x + cardWidth / 2, y + 14, { size: 8, color: COLORS.textLight, align: 'center' });
  });
  y += 22;

  // 六维度分数（横向条形图）
  drawText('六维度能力分析', margin, y, { size: 11, bold: true });
  y += 5;

  const dimKeys = Object.keys(DIMENSION_LABELS);
  const barMaxWidth = contentWidth - 35;

  dimKeys.forEach((key) => {
    const score = data.dimensionScores[key] || 0;
    const label = DIMENSION_LABELS[key];
    const color = DIMENSION_COLORS[key];

    drawText(label, margin, y + 3, { size: 8, color: COLORS.text });

    drawRect(margin + 30, y, barMaxWidth, 4, COLORS.border, 1);
    const barWidth = (score / 100) * barMaxWidth;
    if (barWidth > 0) {
      drawRect(margin + 30, y, barWidth, 4, color, 1);
    }

    drawText(`${score}分`, margin + 30 + barMaxWidth + 2, y + 3, { size: 8, color: COLORS.text });
    y += 6;
  });
  y += 2;
  drawLine(margin, y, pageWidth - margin, y);
  y += 5;

  // 雷达图
  if (data.radarChartImage) {
    checkPageBreak(90);
    drawText('能力维度雷达图', margin, y, { size: 11, bold: true });
    y += 5;
    const imgSize = 70;
    const imgX = (pageWidth - imgSize) / 2;
    try {
      doc.addImage(data.radarChartImage, 'PNG', imgX, y, imgSize, imgSize);
    } catch (e) {
      drawText('[雷达图]', pageWidth / 2, y + 35, { size: 10, color: COLORS.textLight, align: 'center' });
    }
    y += imgSize + 5;
  }

  // 成长趋势图
  if (data.trendChartImage) {
    checkPageBreak(70);
    drawText('成长趋势图', margin, y, { size: 11, bold: true });
    y += 5;
    const imgW = contentWidth;
    const imgH = 50;
    try {
      doc.addImage(data.trendChartImage, 'PNG', margin, y, imgW, imgH);
    } catch (e) {
      drawText('[成长趋势图]', pageWidth / 2, y + 25, { size: 10, color: COLORS.textLight, align: 'center' });
    }
    y += imgH + 5;
  }

  drawFooter();

  // ========== 第2页：AI智能分析 ==========
  addPage();

  if (data.aiAnalysis && Object.keys(data.aiAnalysis).length > 0) {
    drawText('AI智能分析', margin, y, { size: 11, bold: true });
    y += 4;

    const analysisItems = [
      { key: 'knowledgeAnalysis', label: '知识掌握度分析', color: '#3b82f6', bgColor: '#eff6ff' },
      { key: 'logicAbility', label: '逻辑思维能力评估', color: '#8b5cf6', bgColor: '#f5f3ff' },
      { key: 'potential', label: '学习潜力评估', color: '#f59e0b', bgColor: '#fffbeb' },
      { key: 'weakPoints', label: '薄弱环节分析', color: '#ef4444', bgColor: '#fef2f2' },
      { key: 'strengths', label: '优势领域识别', color: '#22c55e', bgColor: '#f0fdf4' },
      { key: 'development', label: '综合发展建议', color: '#14b8a6', bgColor: '#f0fdfa' },
    ];

    analysisItems.forEach((item) => {
      const text = data.aiAnalysis[item.key as keyof typeof data.aiAnalysis];
      if (text) {
        checkPageBreak(25);
        drawRect(margin, y, contentWidth, 5, item.bgColor, 1);
        drawText(`▎ ${item.label}`, margin + 2, y + 3.5, { size: 9, bold: true, color: item.color });
        y += 6;

        const lines = doc.splitTextToSize(text, contentWidth - 4);
        const textHeight = lines.length * 3.5;
        checkPageBreak(textHeight + 2);

        lines.forEach((line: string) => {
          drawText(line, margin + 2, y, { size: 8, color: COLORS.text });
          y += 3.5;
        });
        y += 2;
      }
    });
    y += 2;
    drawLine(margin, y, pageWidth - margin, y);
    y += 5;
  }

  drawFooter();

  // ========== 第3页：知识点掌握度 + 学习规划 ==========
  addPage();

  // 知识点掌握度
  const knowledgeEntries = Object.entries(data.knowledgeStats || {});
  if (knowledgeEntries.length > 0) {
    drawText('知识点掌握度', margin, y, { size: 11, bold: true });
    y += 4;

    drawRect(margin, y, contentWidth, 5, COLORS.bg, 1);
    drawText('知识点', margin + 2, y + 3.5, { size: 8, bold: true });
    drawText('正确/总数', margin + contentWidth * 0.5, y + 3.5, { size: 8, bold: true, align: 'center' });
    drawText('正确率', margin + contentWidth * 0.75, y + 3.5, { size: 8, bold: true, align: 'center' });
    y += 5;

    knowledgeEntries.forEach(([kp, stat], idx) => {
      checkPageBreak(5);
      const rate = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      const bgColor = idx % 2 === 0 ? COLORS.white : COLORS.bg;
      drawRect(margin, y, contentWidth, 4.5, bgColor, 0);
      drawText(kp.substring(0, 20), margin + 2, y + 3.2, { size: 7.5, color: COLORS.text });
      drawText(`${stat.correct}/${stat.total}`, margin + contentWidth * 0.5, y + 3.2, { size: 7.5, align: 'center' });
      drawText(`${rate}%`, margin + contentWidth * 0.75, y + 3.2, { size: 7.5, color: rate >= 80 ? COLORS.success : rate >= 60 ? COLORS.warning : COLORS.danger, align: 'center' });
      y += 4.5;
    });
    y += 2;
    drawLine(margin, y, pageWidth - margin, y);
    y += 5;
  }

  // 学习规划建议
  if (data.learningPlan) {
    checkPageBreak(30);
    drawText('学习规划建议', margin, y, { size: 11, bold: true });
    y += 4;

    const plans = [
      { key: 'shortTerm', label: '短期目标（1个月）', color: COLORS.success },
      { key: 'mediumTerm', label: '中期目标（3个月）', color: COLORS.primary },
      { key: 'longTerm', label: '长期目标（1学期）', color: COLORS.warning },
    ];

    plans.forEach((plan) => {
      const text = data.learningPlan[plan.key as keyof typeof data.learningPlan];
      if (text) {
        checkPageBreak(15);
        drawRect(margin, y, 12, 4, plan.color, 1);
        drawText(plan.label, margin + 6, y + 3, { size: 7, color: COLORS.white, align: 'center' });

        const lines = doc.splitTextToSize(text as string, contentWidth - 18);
        const textHeight = lines.length * 3.5;
        checkPageBreak(textHeight + 2);

        lines.forEach((line: string) => {
          drawText(line, margin + 16, y + 3, { size: 8, color: COLORS.text });
          y += 3.5;
        });
        y += 5;
      }
    });

    if (data.learningPlan.resources && data.learningPlan.resources.length > 0) {
      checkPageBreak(10);
      drawText('推荐学习资源：', margin, y, { size: 9, bold: true, color: COLORS.warning });
      y += 4;
      const resourcesText = data.learningPlan.resources.join('、');
      const resourceLines = doc.splitTextToSize(resourcesText, contentWidth - 4);
      resourceLines.forEach((line: string) => {
        drawText(line, margin + 2, y, { size: 8, color: COLORS.text });
        y += 3.5;
      });
      y += 2;
    }

    y += 2;
    drawLine(margin, y, pageWidth - margin, y);
    y += 5;
  }

  drawFooter();

  // ========== 第4页：课程推荐 + 答题详情 ==========
  addPage();

  if (data.classRecommendation?.className) {
    drawText('课程推荐', margin, y, { size: 11, bold: true });
    y += 4;
    drawRect(margin, y, contentWidth, 12, '#eff6ff', 2);
    drawText(`推荐班级：${data.classRecommendation.className}`, margin + 3, y + 4, { size: 9, bold: true, color: COLORS.primary });
    const reason = data.classRecommendation.reason || '';
    const reasonLines = doc.splitTextToSize(reason, contentWidth - 6);
    reasonLines.forEach((line: string, idx: number) => {
      drawText(line, margin + 3, y + 9 + idx * 3.5, { size: 8, color: COLORS.textLight });
    });
    y += 14;

    if (data.classRecommendation.path && data.classRecommendation.path.length > 0) {
      checkPageBreak(10);
      drawText('学习路径规划：', margin, y, { size: 9, bold: true, color: COLORS.text });
      y += 4;
      const pathText = data.classRecommendation.path.join(' → ');
      const pathLines = doc.splitTextToSize(pathText, contentWidth - 4);
      pathLines.forEach((line: string) => {
        drawText(line, margin + 2, y, { size: 8, color: COLORS.primary });
        y += 3.5;
      });
      y += 2;
    }
    y += 2;
    drawLine(margin, y, pageWidth - margin, y);
    y += 5;
  }

  // 答题详情
  if (data.answerDetails && data.answerDetails.length > 0) {
    checkPageBreak(15);
    drawText('答题详情', margin, y, { size: 11, bold: true });
    y += 4;

    data.answerDetails.forEach((ans, idx) => {
      checkPageBreak(12);
      const bgColor = ans.isCorrect ? '#f0fdf4' : '#fef2f2';
      const borderColor = ans.isCorrect ? '#86efac' : '#fecaca';
      const textColor = ans.isCorrect ? '#166534' : '#991b1b';

      drawRect(margin, y, contentWidth, 10, bgColor, 1);
      doc.setDrawColor(borderColor);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'S');

      drawText(`${ans.sequence}. ${ans.knowledgePoint || '知识点'}`, margin + 2, y + 3.5, { size: 8, bold: true, color: COLORS.text });
      drawText(`您的答案：${ans.studentAnswer || '未作答'} | 正确答案：${ans.correctAnswer}`, margin + 2, y + 7.5, { size: 7.5, color: textColor });
      drawText(ans.isCorrect ? `+${ans.score}` : '0', margin + contentWidth - 15, y + 5.5, { size: 9, bold: true, color: textColor });

      y += 11;
    });
  }

  drawFooter();

  doc.save(`测评报告-${data.studentName || '学生'}-${data.examName || '报告'}.pdf`);
}

function getLevelColor(level: string): string {
  switch (level) {
    case 'A': return '#22c55e';
    case 'B': return '#3b82f6';
    case 'C': return '#f59e0b';
    case 'D': return '#ef4444';
    default: return COLORS.textLight;
  }
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0分';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}分`;
  return `${mins}分${secs}秒`;
}
