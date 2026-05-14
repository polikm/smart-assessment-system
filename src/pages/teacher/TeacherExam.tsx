import { useEffect, useState } from 'react';
import { examApi, classApi, dashboardApi } from '../../api/client';
import {
  ClipboardList, Search, Eye, BarChart3, Users, TrendingUp, Award,
  Calendar, Clock, Filter, GraduationCap, ChevronDown, ChevronUp
} from 'lucide-react';
import ReportDetail from '../../components/ReportDetail';
import { formatDate } from '../../utils/dateFormat';

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

export default function TeacherExam() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [trends, setTrends] = useState<any>(null);
  const [expandedExam, setExpandedExam] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsData, classesData, trendsData] = await Promise.all([
        examApi.list(),
        classApi.list(),
        dashboardApi.trends(),
      ]);
      setExams(examsData);
      setClasses(classesData);
      setTrends(trendsData);

      // 获取所有测评记录
      const allRecords: any[] = [];
      for (const exam of examsData) {
        try {
          const examRecords = await examApi.records(exam.id);
          allRecords.push(...examRecords.map((r: any) => ({ ...r, exam_name: exam.name, course_type: exam.course_type })));
        } catch (e) {}
      }
      setRecords(allRecords);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (record: any) => {
    setSelectedExam(record);
    setDetailLoading(true);
    try {
      const detail = await examApi.recordDetail(record.id);
      setDetailRecord(detail);
    } catch (error) {
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchSearch = !searchQuery || exam.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCourse = !filterCourse || exam.course_type === filterCourse;
    return matchSearch && matchCourse;
  });

  const getExamRecords = (examId: number) => records.filter(r => r.exam_id === examId);

  const getAvgScore = (examId: number) => {
    const examRecords = getExamRecords(examId);
    if (examRecords.length === 0) return 0;
    return Math.round(examRecords.reduce((s, r) => s + (r.score / r.total_score * 100), 0) / examRecords.length);
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
      <h1 className="text-2xl font-bold text-slate-800">测评管理</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card rounded-3xl p-6 text-center">
          <ClipboardList className="mx-auto text-blue-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-slate-800">{exams.length}</p>
          <p className="text-xs text-slate-500 mt-1">试卷总数</p>
        </div>
        <div className="glass-card rounded-3xl p-6 text-center">
          <BarChart3 className="mx-auto text-emerald-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-slate-800">{records.length}</p>
          <p className="text-xs text-slate-500 mt-1">测评次数</p>
        </div>
        <div className="glass-card rounded-3xl p-6 text-center">
          <TrendingUp className="mx-auto text-amber-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-slate-800">
            {records.length > 0
              ? Math.round(records.reduce((s, r) => s + (r.score / r.total_score * 100), 0) / records.length)
              : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">平均正确率</p>
        </div>
        <div className="glass-card rounded-3xl p-6 text-center">
          <Award className="mx-auto text-purple-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-slate-800">
            {records.length > 0
              ? Math.round((records.filter((r) => r.level === 'A' || r.level === 'B').length / records.length) * 100)
              : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">优良率</p>
        </div>
        <div className="glass-card rounded-3xl p-6 text-center">
          <GraduationCap className="mx-auto text-rose-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-slate-800">{classes.length}</p>
          <p className="text-xs text-slate-500 mt-1">班级数</p>
        </div>
      </div>

      {/* 年级分布 */}
      {trends?.gradeDistribution && trends.gradeDistribution.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">年级测评分布</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {trends.gradeDistribution.map((g: any) => (
              <div key={g.grade} className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-lg font-bold text-slate-800">{g.grade}年级</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{g.record_count || 0}</p>
                <p className="text-xs text-slate-500">测评次数</p>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  {g.avg_score ? Math.round(g.avg_score) + '%' : '-'} 平均分
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 筛选 */}
      <div className="glass-card rounded-3xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-11 w-full"
              placeholder="搜索试卷名称..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="input-field"
            >
              <option value="">全部课程</option>
              {Object.entries(courseTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label.text}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 试卷列表 */}
      <div className="space-y-4">
        {filteredExams.map((exam) => {
          const examRecords = getExamRecords(exam.id);
          const avgScore = getAvgScore(exam.id);
          const courseLabel = courseTypeLabels[exam.course_type] || { text: exam.course_type, color: 'bg-slate-100 text-slate-600' };

          const isExpanded = expandedExam === exam.id;

          return (
            <div key={exam.id} className="glass-card rounded-3xl p-6">
              <div
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedExam(isExpanded ? null : exam.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-800">{exam.name}</h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${courseLabel.color}`}>
                      {courseLabel.text}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(exam.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {exam.time_limit}分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList size={14} />
                      {exam.question_count}题
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {examRecords.length}人完成
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{avgScore}%</p>
                    <p className="text-xs text-slate-500">平均分</p>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
              </div>

              {/* 学生成绩 - 可展开 */}
              {isExpanded && examRecords.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">学生成绩 ({examRecords.length}人)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                          <th className="pb-2 font-medium">学生姓名</th>
                          <th className="pb-2 font-medium">得分</th>
                          <th className="pb-2 font-medium">等级</th>
                          <th className="pb-2 font-medium">用时</th>
                          <th className="pb-2 font-medium">测评时间</th>
                          <th className="pb-2 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examRecords.map((record) => (
                          <tr key={record.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-2 text-sm text-slate-800">{record.student_name}</td>
                            <td className="py-2 text-sm font-medium text-slate-800">{record.score}</td>
                            <td className="py-2">
                              <span
                                className="px-2 py-1 rounded-lg text-xs font-medium"
                                style={{
                                  backgroundColor: `${levelColors[record.level]}20`,
                                  color: levelColors[record.level],
                                }}
                              >
                                {record.level}
                              </span>
                            </td>
                            <td className="py-2 text-sm text-slate-600">
                              {Math.floor((record.duration || 0) / 60)}:{String((record.duration || 0) % 60).padStart(2, '0')}
                            </td>
                            <td className="py-2 text-sm text-slate-500">{formatDate(record.created_at)}</td>
                            <td className="py-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); viewDetail(record); }}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                <Eye size={14} />
                                查看详情
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {isExpanded && examRecords.length === 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 text-center py-4 text-sm text-slate-400">
                  暂无学生完成此测评
                </div>
              )}
            </div>
          );
        })}

        {filteredExams.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无测评数据</p>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : detailRecord ? (
              <ReportDetail
                record={detailRecord}
                onClose={() => { setSelectedExam(null); setDetailRecord(null); }}
              />
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>加载失败</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
