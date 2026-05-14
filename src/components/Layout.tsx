import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard,
  UserCircle,
  ClipboardList,
  BarChart3,
  Bell,
  Users,
  Settings,
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Brain,
  Code2,
  FileText,
  CalendarDays,
  Cpu,
  School,
  Trophy,
  Sparkles,
  Shield,
  Award,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  // 学生端
  { path: '/student', label: '首页', icon: <LayoutDashboard size={20} />, roles: ['student'] },
  { path: '/student/exam', label: '在线测评', icon: <ClipboardList size={20} />, roles: ['student'] },
  { path: '/student/report', label: '测评报告', icon: <BarChart3 size={20} />, roles: ['student'] },
  { path: '/student/growth', label: '成长档案', icon: <Trophy size={20} />, roles: ['student'] },
  { path: '/student/info', label: '个人中心', icon: <UserCircle size={20} />, roles: ['student'] },

  // 教师端
  { path: '/teacher', label: '首页', icon: <LayoutDashboard size={20} />, roles: ['teacher'] },
  { path: '/teacher/class', label: '班级管理', icon: <Users size={20} />, roles: ['teacher'] },
  { path: '/teacher/exam', label: '测评管理', icon: <ClipboardList size={20} />, roles: ['teacher'] },
  { path: '/teacher/report', label: '班级报表', icon: <BarChart3 size={20} />, roles: ['teacher'] },
  { path: '/teacher/notice', label: '录取通知', icon: <Bell size={20} />, roles: ['teacher'] },
  { path: '/teacher/students', label: '学生录入', icon: <GraduationCap size={20} />, roles: ['teacher'] },

  // 管理端
  { path: '/admin', label: '首页', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
  { path: '/admin/users', label: '用户管理', icon: <Users size={20} />, roles: ['admin'] },
  { path: '/admin/classes', label: '班级管理', icon: <School size={20} />, roles: ['admin'] },
  { path: '/admin/courses', label: '课程管理', icon: <CalendarDays size={20} />, roles: ['admin'] },
  { path: '/admin/questions', label: '题库管理', icon: <BookOpen size={20} />, roles: ['admin'] },
  { path: '/admin/exams', label: '测评管理', icon: <ClipboardList size={20} />, roles: ['admin'] },
  { path: '/admin/ai-config', label: '智能体管理', icon: <Sparkles size={20} />, roles: ['admin'] },
  { path: '/admin/certificates', label: '证书管理', icon: <Award size={20} />, roles: ['admin'] },
  { path: '/admin/notices', label: '通知管理', icon: <Bell size={20} />, roles: ['admin'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) => user?.role ? item.roles.includes(user.role) : false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-50 ${
        isDark ? 'bg-slate-800 border-r border-slate-700' : 'bg-white border-r border-slate-200'
      }`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Brain className="text-white" size={22} />
          </div>
          <div>
            <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>智能测评系统</h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>素质教育机构</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 mb-2 ${
              isDark
                ? 'text-slate-300 hover:bg-slate-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? '浅色模式' : '深色模式'}
          </button>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{user?.name}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {user?.role === 'student' ? '学生' : user?.role === 'teacher' ? '教师' : '管理员'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 mt-2 ${
              isDark
                ? 'text-slate-300 hover:bg-red-900/30 hover:text-red-400'
                : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Code2 className="text-white" size={18} />
          </div>
          <span className="font-bold text-slate-800">智能测评</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-white z-40 fade-in">
          <nav className="p-4 space-y-1">
            {filteredNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut size={18} />
              退出登录
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50">
        {filteredNavItems.slice(0, 5).map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 p-2 ${
              location.pathname === item.path ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
