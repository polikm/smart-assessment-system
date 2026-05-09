import { useEffect, useState } from 'react';
import { examApi } from '../../api/client';
import { Search, Eye, X, ClipboardList, FileText, Star } from 'lucide-react';

const courseTypeLabels: Record<string, { text: string; color: string }> = {
  aigc: { text: 'AIGC', color: 'bg-purple-100 text-purple-600' },
  scratch: { text: 'Scratch', color: 'bg-amber-100 text-amber-600' },
  python: { text: 'Python', color: 'bg-blue-100 text-blue-600' },
  cpp: { text: 'C++', color: 'bg-emerald-100 text-emerald-600' },
  math: { text: '数理', color: 'bg-rose-100 text-rose-600' },
};

const levelColors: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
};

export default function AdminExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ course_type: '', grade: '', keyword: '' });
  const [previewExam, setPreviewExam] = useState<any>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadExams();
  }, [filter]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter.course_type) params.course_type = filter.course_type;
      if (filter.grade) params.grade = filter.grade;
      if (filter.keyword) params.keyword = filter.keyword;

      const query = Object.keys(params).length > 0 ? '?' + new URLSearchParams(params).toString() : '';
      const data = await examApi.adminList(query);
      setExams(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openPreview = async (exam: any) => {
    setPreviewExam(exam);
    setPreviewLoading(true);
    try {
      const detail = await examApi.get(exam.id);
      setPreviewQuestions(detail.questions || []);
    } catch (error) {
      console.error(error);
      alert('获取试卷详情失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  const renderDifficultyStars = (difficulty: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={12}
            className={i < (difficulty || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
          />
        ))}
      </div>
    );
  };

  const formatStudentNames = (names: string | null, count: number) => {
    if (!names) return '-';
    const nameList = names.split(',').filter(Boolean);
    if (nameList.length === 0) return '-';
    if (nameList.length <= 2) return nameList.join('、');
    return `${nameList.slice(0, 2).join('、')} 等${count}人`;
  };

  const formatScoreRange = (min: number | null, max: number | null, count: number) => {
    if (count === 0) return '-';
    if (min === max) return `${max}分`;
    return `${min || 0}~${max || 0}分`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-800">试卷管理</h1>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-3xl p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={filter.keyword}
              onChange={(e) => setFilter(prev => ({ ...prev, keyword: e.target.value }))}
              className="input-field pl-10 text-sm"
              placeholder="搜索试卷名称"
            />
          </div>
          <select
            value={filter.course_type}
            onChange={(e) => setFilter(prev => ({ ...prev, course_type: e.target.value }))}
            className="input-field w-auto text-sm"
          >
            <option value="">全部课程</option>
            <option value="math">数理逻辑</option>
            <option value="aigc">AIGC素养</option>
            <option value="scratch">Scratch</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
          <select
            value={filter.grade}
            onChange={(e) => setFilter(prev => ({ ...prev, grade: e.target.value }))}
            className="input-field w-auto text-sm"
          >
            <option value="">全部年级</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
              <option key={g} value={g}>{g}年级</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exams Table */}
      <div className="glass-card rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">试卷ID</th>
                <th className="pb-3 font-medium">测评试卷</th>
                <th className="pb-3 font-medium">课程类型</th>
                <th className="pb-3 font-medium">年级</th>
                <th className="pb-3 font-medium">题目数</th>
                <th className="pb-3 font-medium">测评人</th>
                <th className="pb-3 font-medium">测评结果</th>
                <th className="pb-3 font-medium">创建时间</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ClipboardList className="mx-auto mb-2" size={32} />
                    <p>暂无试卷数据</p>
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 text-sm text-slate-600 font-mono">{exam.id}</td>
                    <td className="py-3 text-sm text-slate-800 max-w-xs truncate" title={exam.name}>
                      {exam.name}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${courseTypeLabels[exam.course_type]?.color || 'bg-slate-100 text-slate-600'}`}>
                        {courseTypeLabels[exam.course_type]?.text || exam.course_type}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-600">{exam.grade}年级</td>
                    <td className="py-3 text-sm text-slate-600">{exam.question_count}道</td>
                    <td className="py-3 text-sm text-slate-600 max-w-[120px] truncate" title={exam.student_names || ''}>
                      {formatStudentNames(exam.student_names, exam.record_count)}
                    </td>
                    <td className="py-3 text-sm text-slate-600">
                      {formatScoreRange(exam.min_score, exam.max_score, exam.record_count)}
                    </td>
                    <td className="py-3 text-sm text-slate-500">
                      {new Date(exam.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => openPreview(exam)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Eye size={14} />
                        预览
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewExam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{previewExam.name}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  试卷ID: {previewExam.id} | {courseTypeLabels[previewExam.course_type]?.text || previewExam.course_type} | {previewExam.grade}年级 | {previewExam.question_count}题 | 总分{previewExam.total_score}分 | 限时{previewExam.time_limit}分钟
                </p>
              </div>
              <button
                onClick={() => { setPreviewExam(null); setPreviewQuestions([]); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {previewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : previewQuestions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="mx-auto mb-2" size={32} />
                  <p>该试卷暂无题目</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {previewQuestions.map((q, idx) => (
                    <div key={q.id} className="border border-slate-100 rounded-2xl p-5">
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                            {q.sequence}
                          </span>
                          <span className="text-sm font-medium text-slate-700">{q.content}</span>
                        </div>
                        <span className="shrink-0 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium">
                          {q.exam_score}分
                        </span>
                      </div>

                      {/* Options */}
                      <div className="space-y-2 ml-9">
                        {JSON.parse(q.options || '[]').map((opt: string, optIdx: number) => {
                          const optLetter = String.fromCharCode(65 + optIdx);
                          const isCorrect = optLetter === q.answer;
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-3 p-2.5 rounded-xl ${
                                isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100'
                              }`}
                            >
                              <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {optLetter}
                              </span>
                              <span className={`text-sm ${isCorrect ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
                                {opt}
                              </span>
                              {isCorrect && (
                                <span className="ml-auto text-xs font-bold text-emerald-600">正确答案</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Question Meta */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 ml-9 text-xs text-slate-500">
                        <span className="px-2 py-1 bg-slate-100 rounded-md">{q.knowledge_point || '未分类'}</span>
                        <span className="flex items-center gap-1">
                          难度: {renderDifficultyStars(q.difficulty)}
                        </span>
                        <span>题目ID: {q.id}</span>
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-3 ml-9 p-3 bg-blue-50 rounded-xl">
                          <p className="text-xs font-bold text-blue-700 mb-1">解析</p>
                          <p className="text-xs text-blue-800">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Duplicate Check */}
                  {(() => {
                    const idSet = new Set();
                    const duplicates: number[] = [];
                    for (const q of previewQuestions) {
                      if (idSet.has(q.id)) {
                        duplicates.push(q.id);
                      }
                      idSet.add(q.id);
                    }
                    if (duplicates.length > 0) {
                      return (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                          <p className="text-sm font-bold text-red-700">
                            检测到重复题目！重复ID: {duplicates.join(', ')}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                        <p className="text-sm font-bold text-emerald-700">
                          题目去重检查通过：共{previewQuestions.length}道题，无重复题目
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
