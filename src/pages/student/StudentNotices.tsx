import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { noticeApi, studentApi } from '../../api/client';
import { Bell, Mail, Calendar, Eye, Award } from 'lucide-react';
import AdmissionPoster from '../../components/AdmissionPoster';
import { posterTemplates, type PosterData } from '../../utils/posterCanvas';

export default function StudentNotices() {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const currentStudent = await studentApi.me();
      if (currentStudent) {
        const noticesData = await noticeApi.list({ student_id: currentStudent.id.toString() });
        setNotices(noticesData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeClick = async (notice: any) => {
    setSelectedNotice(notice);
    if (!notice.is_read) {
      try {
        await noticeApi.markRead(notice.id);
        setNotices((prev) =>
          prev.map((n) => (n.id === notice.id ? { ...n, is_read: 1 } : n))
        );
      } catch (error) {
        console.error('标记已读失败:', error);
      }
    }
  };

  const getNoticePosterData = (notice: any): PosterData => {
    if (notice.notice_data) {
      try {
        const data = JSON.parse(notice.notice_data);
        return {
          studentName: data.studentName || '同学',
          courseTypeName: data.courseTypeName || data.courseType || '科技',
          level: data.level || 'B',
          score: data.score || 0,
          schoolName: data.schoolName || '未来科技学院',
          date: data.date || new Date(notice.sent_at).toLocaleDateString('zh-CN'),
          phone: data.phone || '400-888-8888',
        };
      } catch (e) {}
    }

    const content = notice.content || '';
    const nameMatch = content.match(/恭喜\s*(.+?)\s*同学/);
    const courseMatch = content.match(/录取至\s*(.+?)(?:级班|班)/);
    const levelMatch = content.match(/([ABCD])级/);
    const scoreMatch = content.match(/(\d+)分/);

    return {
      studentName: nameMatch ? nameMatch[1] : '同学',
      courseTypeName: courseMatch ? courseMatch[1].trim() : '编程',
      level: levelMatch ? levelMatch[1] : 'B',
      score: scoreMatch ? parseInt(scoreMatch[1]) : 85,
      schoolName: '未来科技学院',
      date: new Date(notice.sent_at).toLocaleDateString('zh-CN'),
      phone: '400-888-8888',
    };
  };

  const getNoticeTemplateId = (notice: any): string => {
    if (notice.template_design_config) {
      try {
        const config = JSON.parse(notice.template_design_config);
        return config.templateId || 'academic';
      } catch (e) {}
    }
    if (notice.notice_data) {
      try {
        const data = JSON.parse(notice.notice_data);
        return data.templateId || 'academic';
      } catch (e) {}
    }
    return 'academic';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">通知中心</h1>
        {notices.length > 0 && (
          <span className="text-sm text-slate-500">
            共 {notices.length} 条通知
            {notices.filter((n) => !n.is_read).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                {notices.filter((n) => !n.is_read).length} 未读
              </span>
            )}
          </span>
        )}
      </div>

      {notices.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <Bell className="mx-auto text-slate-300 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-700">暂无通知</h2>
          <p className="text-slate-500 mt-2">您暂时没有收到任何通知</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => {
            const isUnread = !notice.is_read;
            const posterData = getNoticePosterData(notice);

            return (
              <div
                key={notice.id}
                onClick={() => handleNoticeClick(notice)}
                className={`glass-card rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isUnread ? 'ring-1 ring-blue-200 bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnread ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    {isUnread ? (
                      <Award className="text-blue-600" size={20} />
                    ) : (
                      <Mail className="text-slate-400" size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold ${isUnread ? 'text-slate-800' : 'text-slate-600'}`}>
                        录取通知书
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      恭喜{posterData.studentName}同学，经综合测评，您已被录取至{posterData.courseTypeName}{posterData.level}级班...
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={12} />
                        {new Date(notice.sent_at).toLocaleDateString('zh-CN')}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-blue-500">
                        <Eye size={12} />
                        点击查看海报
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedNotice && (
        <AdmissionPoster
          data={getNoticePosterData(selectedNotice)}
          templateId={getNoticeTemplateId(selectedNotice)}
          onClose={() => setSelectedNotice(null)}
        />
      )}
    </div>
  );
}
