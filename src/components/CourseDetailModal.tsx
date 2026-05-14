import { useEffect, useState } from 'react';
import { courseApi } from '../api/client';
import {
  X, GraduationCap, Clock, DollarSign, Users, Calendar,
  MapPin, BookOpen, Target, ChevronRight, UserCheck
} from 'lucide-react';
import { formatDate } from '../utils/dateFormat';

const courseTypeLabels: Record<string, { text: string; color: string; bg: string; icon: string }> = {
  aigc: { text: 'AIGC素养', color: 'text-purple-600', bg: 'bg-purple-100', icon: '🎨' },
  scratch: { text: 'Scratch', color: 'text-amber-600', bg: 'bg-amber-100', icon: '🧩' },
  python: { text: 'Python', color: 'text-blue-600', bg: 'bg-blue-100', icon: '🐍' },
  cpp: { text: 'C++', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: '⚡' },
};

const scheduleStatusLabels: Record<string, { text: string; color: string; bg: string }> = {
  upcoming: { text: '即将开班', color: 'text-blue-600', bg: 'bg-blue-100' },
  ongoing: { text: '进行中', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  completed: { text: '已结束', color: 'text-slate-600', bg: 'bg-slate-100' },
  full: { text: '已满员', color: 'text-amber-600', bg: 'bg-amber-100' },
};

interface Schedule {
  id: number;
  name: string;
  teacher: string;
  start_date: string;
  end_date: string;
  schedule_time: string;
  location: string;
  capacity: number;
  enrolled: number;
  status: string;
}

interface Course {
  id: number;
  name: string;
  course_type: string;
  grade_range: string;
  description: string;
  syllabus: string;
  target_audience: string;
  total_hours: number;
  price: number;
  status: string;
  schedules?: Schedule[];
}

interface CourseDetailModalProps {
  courseId: number;
  onClose: () => void;
}

export default function CourseDetailModal({ courseId, onClose }: CourseDetailModalProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseDetail();
  }, [courseId]);

  const loadCourseDetail = async () => {
    try {
      const data = await courseApi.get(courseId);
      setCourse(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSyllabus = (syllabus: string | undefined): string[] => {
    if (!syllabus) return [];
    try {
      const parsed = JSON.parse(syllabus);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return syllabus.split('\n').filter(s => s.trim());
    }
    return [];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-500 mt-4 text-center">加载中...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full">
          <div className="text-center">
            <p className="text-slate-500">课程信息加载失败</p>
            <button onClick={onClose} className="btn-primary mt-4">关闭</button>
          </div>
        </div>
      </div>
    );
  }

  const typeLabel = courseTypeLabels[course.course_type] || courseTypeLabels.scratch;
  const syllabusList = getSyllabus(course.syllabus);
  const activeSchedules = course.schedules?.filter(s => ['upcoming', 'ongoing', 'full'].includes(s.status)) || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeLabel.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{course.name}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${typeLabel.bg} ${typeLabel.color}`}>
                {typeLabel.text}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 text-center">
              <GraduationCap className="mx-auto text-blue-500 mb-1" size={20} />
              <p className="text-sm font-bold text-slate-800">{course.grade_range}</p>
              <p className="text-xs text-slate-500">适合年级</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <Clock className="mx-auto text-emerald-500 mb-1" size={20} />
              <p className="text-sm font-bold text-slate-800">{course.total_hours}课时</p>
              <p className="text-xs text-slate-500">总课时</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <DollarSign className="mx-auto text-amber-500 mb-1" size={20} />
              <p className="text-sm font-bold text-slate-800">¥{course.price}</p>
              <p className="text-xs text-slate-500">课程价格</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <Users className="mx-auto text-purple-500 mb-1" size={20} />
              <p className="text-sm font-bold text-slate-800">{activeSchedules.length}个</p>
              <p className="text-xs text-slate-500">开班计划</p>
            </div>
          </div>

          {/* 课程描述 */}
          {course.description && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" />
                课程简介
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-2xl p-4">
                {course.description}
              </p>
            </div>
          )}

          {/* 适合人群 */}
          {course.target_audience && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Target size={16} className="text-emerald-500" />
                适合人群
              </h3>
              <p className="text-sm text-slate-600 bg-emerald-50 rounded-2xl p-4">
                {course.target_audience}
              </p>
            </div>
          )}

          {/* 课程大纲 */}
          {syllabusList.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-purple-500" />
                课程大纲
              </h3>
              <div className="space-y-2">
                {syllabusList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <span className="shrink-0 w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 开班计划 */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-amber-500" />
              开班计划
            </h3>
            {course.schedules && course.schedules.length > 0 ? (
              <div className="space-y-3">
                {course.schedules.map((schedule) => (
                  <div key={schedule.id} className="border border-slate-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-800">{schedule.name}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${scheduleStatusLabels[schedule.status]?.bg} ${scheduleStatusLabels[schedule.status]?.color}`}>
                        {scheduleStatusLabels[schedule.status]?.text}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <UserCheck size={12} className="text-slate-400" />
                        教师：{schedule.teacher || '待定'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {schedule.start_date ? formatDate(schedule.start_date) : '待定'}
                        {schedule.end_date ? ` ~ ${formatDate(schedule.end_date)}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {schedule.schedule_time || '待定'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {schedule.location || '待定'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.min(((schedule.enrolled || 0) / (schedule.capacity || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">
                        {schedule.enrolled || 0}/{schedule.capacity || 20}人
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-2xl">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                暂无开班计划，敬请期待
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
