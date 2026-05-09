import { useNavigate } from 'react-router-dom';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { Brain, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { label: '首页', href: '#hero' },
  { label: '功能', href: '#features' },
  { label: 'AI智能体', href: '#ai-agents' },
  { label: '评价', href: '#testimonials' },
];

export default function LandingNav() {
  const scrollY = useScrollPosition();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isScrolled = scrollY > 50;

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => scrollTo('#hero')}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="text-white" size={20} />
            </div>
            <span
              className={`font-bold text-lg transition-colors ${
                isScrolled ? 'text-slate-800' : 'text-white'
              }`}
            >
              智测云
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={`text-sm font-medium transition-colors hover:opacity-80 ${
                  isScrolled ? 'text-slate-600' : 'text-white/90'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${
                isScrolled
                  ? 'text-blue-600 hover:bg-blue-50'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              免费注册
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-xl transition-colors ${
              isScrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white hover:bg-white/10'
            }`}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-100 fade-in">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left px-4 py-3 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-sm font-medium transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => { navigate('/login'); setMobileOpen(false); }}
                className="flex-1 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
              >
                登录
              </button>
              <button
                onClick={() => { navigate('/register'); setMobileOpen(false); }}
                className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                免费注册
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
