import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { studentApi, knowledgeApi } from '../../api/client';
import PageHeader from '../../components/PageHeader';
import { useTheme } from '../../components/ThemeProvider';
import GrowthCurveChart from '../../components/GrowthCurveChart';
import { formatDate } from '../../utils/dateFormat';
import {
  Trophy,
  TrendingUp,
  Clock,
  Award,
  Star,
  Zap,
  Target,
  BookOpen,
  Medal,
  Crown,
  Flame,
  Sparkles,
} from 'lucide-react';

const badgeIcons: Record<string, React.ReactNode> = {
  first_exam: <Star size={24} />,
  perfect_score: <Crown size={24} />,
  streak_3: <Flame size={24} />,
  level_a: <Award size={24} />,
  all_courses: <BookOpen size={24} />,
  quick_learner: <Zap size={24} />,
  persistent: <Target size={24} />,
  explorer: <Sparkles size={24} />,
};

const defaultBadges = [
  { code: 'first_exam', name: '初次测评', description: '完成第一次测评', icon: 'first_exam', category: '入门' },
  { code: 'perfect_score', name: '满分达人', description: '单次测评获得满分', icon: 'perfect_score', category: '成就' },
  { code: 'streak_3', name: '三连击', description: '连续3次测评获得A级', icon: 'streak_3', category: '成就' },
  { code: 'level_a', name: '优秀学员', description: '获得A级评价', icon: 'level_a', category: '等级' },
  { code: 'all_courses', name: '全课程探索', description: '完成所有课程类型的测评', icon: 'all_courses', category: '探索' },
  { code: 'quick_learner', name: '快速学习者', description: '在30分钟内完成测评并获得B级以上', icon: 'quick_learner', category: '技能' },
  { code: 'persistent', name: '持之以恒', description: '累计完成10次测评', icon: 'persistent', category: '坚持' },
  { code: 'explorer', name: '探索者', description: '尝试3种不同的课程类型', icon: 'explorer', category: '探索' },
];

export default function StudentGrowth() {
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const [student, setStudent] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'growth' | 'badges' | 'certificates'>('timeline');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentStudent = await studentApi.me();
      if (currentStudent) {
        setStudent(currentStudent);
        const [recordsData, profileData] = await Promise.all([
          studentApi.records(currentStudent.id),
          knowledgeApi.studentProfile(currentStudent.id).catch(() => null),
        ]);
        setRecords(recordsData);
        setProfile(profileData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadges = defaultBadges.map((badge) => ({
    ...badge,
    earned: records.length > 0 && (
      badge.code === 'first_exam' ? records.length >= 1 :
      badge.code === 'level_a' ? records.some((r) => r.level === 'A') :
      badge.code === 'streak_3' ? records.filter((r) => r.level === 'A').length >= 3 :
      badge.code === 'persistent' ? records.length >= 10 :
      false
    ),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="成长档案" description="查看你的测评成长轨迹、成就徽章和证书" />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: '测评次数', value: records.length, icon: Trophy, color: 'bg-blue-500' },
          { title: '获得A级', value: records.filter((r) => r.level === 'A').length, icon: Award, color: 'bg-green-500' },
          { title: '徽章数', value: earnedBadges.filter((b) => b.earned).length, icon: Medal, color: 'bg-purple-500' },
          { title: '总时长', value: `${Math.floor(records.reduce((sum, r) => sum + (r.duration || 0), 0) / 60)}分`, icon: Clock, color: 'bg-amber-500' },
        ].map((card, index) => (
          <div key={index} className={`rounded-2xl p-5 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={20} className="text-white" />
            </div>
            <p className={`text-2xl font-bold mt-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>{card.value}</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.title}</p>
          </div>
        ))}
      </div>

      {/* Tab切换 */}
      <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className={`flex border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          {[
            { key: 'timeline', label: '测评时间线' },
            { key: 'growth', label: '能力成长曲线' },
            { key: 'badges', label: '成就徽章' },
            { key: 'certificates', label: '测评证书' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {records.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p>还没有测评记录，快去开始第一次测评吧！</p>
                </div>
              ) : (
                records.map((record, index) => (
                  <div key={record.id} className={`flex gap-4 p-4 rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      record.level === 'A' ? 'bg-green-100 text-green-600' :
                      record.level === 'B' ? 'bg-blue-100 text-blue-600' :
                      record.level === 'C' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <TrendingUp size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{record.exam_name || '测评记录'}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.level === 'A' ? 'bg-green-100 text-green-700' :
                          record.level === 'B' ? 'bg-blue-100 text-blue-700' :
                          record.level === 'C' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {record.level}级
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        得分: {record.score}分 | 用时: {Math.floor((record.duration || 0) / 60)}分{record.duration % 60}秒
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatDate(record.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.code}
                  className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                    badge.earned
                      ? isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                      : isDark ? 'bg-slate-800/50 border-slate-700 opacity-50' : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                    badge.earned ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {badgeIcons[badge.icon] || <Star size={24} />}
                  </div>
                  <h3 className={`text-sm font-medium mt-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>{badge.name}</h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{badge.description}</p>
                  {badge.earned && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      已获得
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'growth' && (
            <div>
              {records.length > 1 ? (
                <GrowthCurveChart records={records} />
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                  <p>需要至少2次测评记录才能展示成长曲线</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="space-y-4">
              {records.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Award size={48} className="mx-auto mb-4 opacity-50" />
                  <p>暂无证书，完成测评后可获得</p>
                </div>
              ) : (
                records.filter((r) => r.level === 'A' || r.level === 'B').map((record) => (
                  <div key={record.id} className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      record.level === 'A' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Award size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {record.level === 'A' ? '优秀学员证书' : '良好学员证书'}
                      </h3>
                      <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {record.exam_name || '测评证书'} · {record.score}分 · {record.level}级
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatDate(record.created_at)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.level === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {record.level}级
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
