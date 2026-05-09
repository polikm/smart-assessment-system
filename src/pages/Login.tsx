import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/client';
import { Brain, Eye, EyeOff, Lock, User, Phone, Mail } from 'lucide-react';

export default function Login() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const detectAccountType = (value: string) => {
    if (/^\d{11}$/.test(value)) return 'phone';
    if (value.includes('@')) return 'email';
    return 'username';
  };

  const accountType = detectAccountType(account);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginData: any = { password };

      if (accountType === 'phone') {
        loginData.phone = account;
      } else if (accountType === 'email') {
        loginData.email = account;
      } else {
        loginData.username = account;
      }

      const data = await authApi.login(loginData);
      setAuth(data.user, data.token);

      if (data.user.role === 'student') navigate('/student');
      else if (data.user.role === 'teacher') navigate('/teacher');
      else navigate('/admin');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8 slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 float-animation">
              <Brain className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">智能测评系统</h1>
            <p className="text-sm text-slate-500 mt-1">素质教育机构入学测评平台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                账号
                {accountType === 'phone' && <span className="text-emerald-500 text-xs ml-2">手机号</span>}
                {accountType === 'email' && <span className="text-emerald-500 text-xs ml-2">邮箱</span>}
              </label>
              <div className="relative">
                {accountType === 'email' ? (
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                ) : accountType === 'phone' ? (
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                ) : (
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                )}
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="input-field pl-11"
                  placeholder="用户名 / 手机号 / 邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              还没有账号？{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                立即注册
              </Link>
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
            <p className="text-xs text-blue-700 font-medium mb-2">演示账号：</p>
            <div className="space-y-1 text-xs text-blue-600">
              <p>管理员：admin / admin123</p>
              <p>教师：teacher1 / teacher123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
