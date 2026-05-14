import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { noticeApi } from '../../api/client';
import { useTheme } from '../../components/ThemeProvider';
import PageHeader from '../../components/PageHeader';
import {
  User, Shield, GraduationCap, ChevronRight,
  Bell, Award, Star, Flame, Trophy, Mail
} from 'lucide-react';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

export default function StudentInfo() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
    loadUnreadCount();
  }, []);

  const loadBadges = async () => {
    setBadges([
      { id: 1, name: '初出茅庐', description: '完成首次测评', icon: 'star', earned_at: '2024-01-15' },
      { id: 2, name: '学习达人', description: '连续完成5次测评', icon: 'flame', earned_at: '2024-02-20' },
      { id: 3, name: '优秀学员', description: '测评总分达到90分', icon: 'trophy', earned_at: '2024-03-10' },
    ]);
    setLoading(false);
  };

  const loadUnreadCount = async () => {
    try {
      const notices = await noticeApi.list({});
      const unread = notices.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error(error);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'star': return <Star size={20} className="text-amber-600" />;
      case 'flame': return <Flame size={20} className="text-orange-600" />;
      case 'trophy': return <Trophy size={20} className="text-emerald-600" />;
      default: return <Award size={20} className="text-blue-600" />;
    }
  };

  const menuItems = [
    {
      title: '账户信息',
      description: '管理账户、密码、手机号和成长徽章',
      icon: Shield,
      path: '/student/profile',
      color: 'bg-blue-500',
    },
    {
      title: '学生基础信息',
      description: '填写学习背景，用于智能组卷和课程推荐',
      icon: GraduationCap,
      path: '/student/base-info',
      color: 'bg-emerald-500',
    },
    {
      title: '通知中心',
      description: '查看录取通知书和系统通知',
      icon: Bell,
      path: '/student/notices',
      color: 'bg-amber-500',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto fade-in space-y-6">
      <PageHeader title="个人中心" description="管理您的账户信息、学生基础信息和通知" />

      {/* 用户信息卡片 */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <User className="text-blue-600" size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {user?.name || '-'}
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {user?.role === 'student' ? '学生' : user?.role === 'teacher' ? '教师' : '管理员'}
              {user?.username && ` · ${user.username}`}
            </p>
          </div>
        </div>
      </div>

      {/* 成长徽章预览 */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Award className="text-amber-600" size={20} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>成长徽章</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>您在测评过程中获得的荣誉</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/profile')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            查看全部
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border text-center transition-all hover:shadow-md ${
                  isDark
                    ? 'bg-slate-700/50 border-slate-600 hover:border-amber-500/50'
                    : 'bg-amber-50/50 border-amber-100 hover:border-amber-300'
                }`}
              >
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  {getBadgeIcon(badge.icon)}
                </div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{badge.name}</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{badge.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 二级入口菜单 */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 hover:shadow-md ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                : 'bg-white border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center shrink-0`}>
              <item.icon className="text-white" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {item.title}
                </h3>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {item.description}
              </p>
            </div>
            <ChevronRight size={20} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          </button>
        ))}
      </div>

      {/* 快速预览卡片 */}
      <div className={`mt-6 p-5 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Mail className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>通知摘要</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {unreadCount > 0 ? `您有 ${unreadCount} 条未读通知` : '暂无未读通知'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/student/notices')}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          查看通知中心
        </button>
      </div>
    </div>
  );
}
