import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { studentApi } from '../../api/client';
import {
  User, GraduationCap, School, Calculator, Brain, Code, Award,
  Save, Check, ChevronRight, ChevronLeft, Heart, Monitor, Clock,
  Users, Sparkles, Lightbulb, Edit3, Lock, X
} from 'lucide-react';

interface FormData {
  name: string;
  gender: string;
  birth_year: string;
  birth_month: string;
  school: string;
  grade: string;
  math_score: string;
  ai_base: string;
  programming_base: string;
  awards: string[];
  interest_aigc: string;
  interest_programming: string;
  has_computer: string;
  parent_support: string;
  learning_time: string;
  logical_ability: string;
  prior_courses: string[];
}

const initialFormData: FormData = {
  name: '',
  gender: '',
  birth_year: '',
  birth_month: '',
  school: '',
  grade: '',
  math_score: '',
  ai_base: '',
  programming_base: '',
  awards: [],
  interest_aigc: '',
  interest_programming: '',
  has_computer: '',
  parent_support: '',
  learning_time: '',
  logical_ability: '',
  prior_courses: [],
};

const steps = [
  { id: 1, title: '基础信息', icon: 'User' },
  { id: 2, title: '学习背景', icon: 'GraduationCap' },
  { id: 3, title: '兴趣与条件', icon: 'Heart' },
  { id: 4, title: '能力自评', icon: 'Sparkles' },
] as const;

const iconMap: Record<string, any> = {
  User,
  GraduationCap,
  Heart,
  Sparkles,
};

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {children}
      <span className="text-red-500 ml-0.5">*</span>
    </label>
  );
}

export default function StudentInfo() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [student, setStudent] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = async () => {
    try {
      const currentStudent = await studentApi.me();
      if (currentStudent) {
        setStudent(currentStudent);
        setFormData({
          name: currentStudent.name || '',
          gender: currentStudent.gender || '',
          birth_year: currentStudent.birth_date ? currentStudent.birth_date.split('-')[0] : '',
          birth_month: currentStudent.birth_date ? currentStudent.birth_date.split('-')[1] : '',
          school: currentStudent.school || '',
          grade: currentStudent.grade?.toString() || '',
          math_score: currentStudent.math_score || '',
          ai_base: currentStudent.ai_base || '',
          programming_base: currentStudent.programming_base || '',
          awards: currentStudent.awards ? currentStudent.awards.split(',').filter(Boolean) : [],
          interest_aigc: currentStudent.interest_aigc?.toString() || '',
          interest_programming: currentStudent.interest_programming?.toString() || '',
          has_computer: currentStudent.has_computer || '',
          parent_support: currentStudent.parent_support || '',
          learning_time: currentStudent.learning_time || '',
          logical_ability: currentStudent.logical_ability || '',
          prior_courses: currentStudent.prior_courses ? currentStudent.prior_courses.split(',').filter(Boolean) : [],
        });
        // 如果信息完整，默认进入查看模式
        const isComplete = !!(currentStudent.name && currentStudent.gender && currentStudent.grade && currentStudent.school);
        setIsViewMode(isComplete);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSelect = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleMultiSelect = (field: 'awards' | 'prior_courses', value: string) => {
    const current = formData[field];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter((v) => v !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const isFirstTime = !student?.grade;

  const handleSubmit = async () => {
    if (!student) {
      alert('系统初始化中，请稍后重试');
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      await studentApi.update(student.id, {
        ...formData,
        birth_date: formData.birth_year && formData.birth_month
          ? `${formData.birth_year}-${formData.birth_month}-01`
          : '',
        grade: parseInt(formData.grade) || null,
        interest_aigc: parseInt(formData.interest_aigc) || 0,
        interest_programming: parseInt(formData.interest_programming) || 0,
        awards: formData.awards.join(','),
        prior_courses: formData.prior_courses.join(','),
      });
      setSaved(true);
      setIsViewMode(true);
      setShowConfirmModal(false);
      // 刷新学生数据
      await loadStudent();
      if (isFirstTime) {
        setTimeout(() => {
          navigate('/student/exam-loading');
        }, 800);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.gender && formData.birth_year && formData.birth_month && formData.school && formData.grade;
      case 2:
        return formData.math_score && formData.ai_base && formData.programming_base;
      case 3:
        return formData.interest_aigc && formData.interest_programming && formData.has_computer && formData.parent_support && formData.learning_time;
      case 4:
        return formData.logical_ability;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 查看模式渲染
  if (isViewMode && !isFirstTime) {
    return (
      <div className="max-w-2xl mx-auto fade-in">
        <div className="glass-card rounded-3xl p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="text-blue-600" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">个人中心</h1>
                <p className="text-sm text-slate-500">查看和管理您的个人信息</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsViewMode(false);
                setCurrentStep(1);
                setSaved(false);
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit3 size={16} />
              修改信息
            </button>
          </div>

          {/* 基础信息卡片 */}
          <div className="space-y-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <User size={16} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">基础信息</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">姓名：</span><span className="text-slate-800 font-medium">{student?.name || '-'}</span></div>
                <div><span className="text-slate-500">性别：</span><span className="text-slate-800 font-medium">{student?.gender === 'male' ? '男' : student?.gender === 'female' ? '女' : '-'}</span></div>
                <div><span className="text-slate-500">出生年月：</span><span className="text-slate-800 font-medium">{student?.birth_date || '-'}</span></div>
                <div><span className="text-slate-500">在读年级：</span><span className="text-slate-800 font-medium">{student?.grade ? `${student.grade}年级` : '-'}</span></div>
                <div className="col-span-2"><span className="text-slate-500">在读学校：</span><span className="text-slate-800 font-medium">{student?.school || '-'}</span></div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={16} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">学习背景</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">数学成绩：</span><span className="text-slate-800 font-medium">{student?.math_score || '-'}</span></div>
                <div><span className="text-slate-500">AI基础：</span><span className="text-slate-800 font-medium">{student?.ai_base || '-'}</span></div>
                <div><span className="text-slate-500">编程基础：</span><span className="text-slate-800 font-medium">{student?.programming_base || '-'}</span></div>
                <div><span className="text-slate-500">获奖情况：</span><span className="text-slate-800 font-medium">{student?.awards || '无'}</span></div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Heart size={16} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">兴趣与条件</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">AIGC兴趣度：</span><span className="text-slate-800 font-medium">{student?.interest_aigc ? ['', '不感兴趣', '一般', '感兴趣', '非常感兴趣'][student.interest_aigc] : '-'}</span></div>
                <div><span className="text-slate-500">编程兴趣度：</span><span className="text-slate-800 font-medium">{student?.interest_programming ? ['', '不感兴趣', '一般', '感兴趣', '非常感兴趣'][student.interest_programming] : '-'}</span></div>
                <div><span className="text-slate-500">电脑/平板：</span><span className="text-slate-800 font-medium">{student?.has_computer || '-'}</span></div>
                <div><span className="text-slate-500">家长支持：</span><span className="text-slate-800 font-medium">{student?.parent_support || '-'}</span></div>
                <div><span className="text-slate-500">学习时间：</span><span className="text-slate-800 font-medium">{student?.learning_time || '-'}</span></div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">能力自评</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">逻辑思维：</span><span className="text-slate-800 font-medium">{student?.logical_ability || '-'}</span></div>
                <div><span className="text-slate-500">已学课程：</span><span className="text-slate-800 font-medium">{student?.prior_courses || '无'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step.id < currentStep
                  ? 'bg-emerald-500 text-white'
                  : step.id === currentStep
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step.id < currentStep ? <Check size={18} /> : React.createElement(iconMap[step.icon], { size: 18 })}
            </div>
            <span
              className={`text-xs mt-2 font-medium ${
                step.id <= currentStep ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {step.title}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                step.id < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderOptionCard = (
    key: string,
    label: string,
    selected: boolean,
    onClick: () => void,
    icon?: React.ReactNode
  ) => (
    <button
      key={key}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
      }`}
    >
      <div
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          selected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
        }`}
      >
        {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
      </div>
      {icon && <span className="text-slate-400">{icon}</span>}
      <span className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-slate-700'}`}>
        {label}
      </span>
    </button>
  );

  const renderMultiOptionCard = (
    key: string,
    label: string,
    selected: boolean,
    onClick: () => void
  ) => (
    <button
      key={key}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
      }`}
    >
      <div
        className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
          selected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
        }`}
      >
        {selected && <Check size={14} className="text-white" />}
      </div>
      <span className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-slate-700'}`}>
        {label}
      </span>
    </button>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <RequiredLabel>姓名</RequiredLabel>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="请输入姓名"
        />
      </div>

      <div>
        <RequiredLabel>性别</RequiredLabel>
        <div className="grid grid-cols-2 gap-3">
          {renderOptionCard('gender-male', '男', formData.gender === 'male', () => handleSingleSelect('gender', 'male'), <User size={16} />)}
          {renderOptionCard('gender-female', '女', formData.gender === 'female', () => handleSingleSelect('gender', 'female'), <User size={16} />)}
        </div>
      </div>

      <div>
        <RequiredLabel>出生年月</RequiredLabel>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={formData.birth_year}
            onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
            className="input-field"
          >
            <option value="">选择年份</option>
            {Array.from({ length: 15 }, (_, i) => 2010 + i).map((y) => (
              <option key={y} value={String(y)}>{y}年</option>
            ))}
          </select>
          <select
            value={formData.birth_month}
            onChange={(e) => setFormData({ ...formData, birth_month: e.target.value })}
            className="input-field"
          >
            <option value="">选择月份</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={String(m).padStart(2, '0')}>{m}月</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <RequiredLabel>在读学校</RequiredLabel>
        <input
          type="text"
          value={formData.school}
          onChange={(e) => setFormData({ ...formData, school: e.target.value })}
          className="input-field"
          placeholder="请输入学校名称"
        />
      </div>

      <div>
        <RequiredLabel>在读年级</RequiredLabel>
        <select
          value={formData.grade}
          onChange={(e) => handleSingleSelect('grade', e.target.value)}
          className="input-field"
        >
          <option value="">请选择年级</option>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((g) => (
            <option key={g} value={g}>{g}年级</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <RequiredLabel>数学成绩水平</RequiredLabel>
        <div className="space-y-2">
          {['优秀（90分以上）', '良好（80-89分）', '中等（70-79分）', '需提高（70分以下）'].map((opt) =>
            renderOptionCard(`math-${opt}`, opt, formData.math_score === opt, () => handleSingleSelect('math_score', opt), <Calculator size={16} />)
          )}
        </div>
      </div>

      <div>
        <RequiredLabel>AI基础</RequiredLabel>
        <div className="space-y-2">
          {['无基础', '了解过AI概念', '有使用AI工具经验', '熟练运用AI工具'].map((opt) =>
            renderOptionCard(`ai-${opt}`, opt, formData.ai_base === opt, () => handleSingleSelect('ai_base', opt), <Brain size={16} />)
          )}
        </div>
      </div>

      <div>
        <RequiredLabel>编程基础</RequiredLabel>
        <div className="space-y-2">
          {['无基础', '学过Scratch', '学过Python', '学过C++', '学过其他语言'].map((opt) =>
            renderOptionCard(`prog-${opt}`, opt, formData.programming_base === opt, () => handleSingleSelect('programming_base', opt), <Code size={16} />)
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">获奖情况（可多选）</label>
        <div className="space-y-2">
          {['无', '数学竞赛获奖', '信息学竞赛获奖', '科技创新大赛获奖', '其他奖项'].map((opt) =>
            renderMultiOptionCard(`award-${opt}`, opt, formData.awards.includes(opt), () => handleMultiSelect('awards', opt))
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
          <Lightbulb size={16} />
          兴趣与条件是智能推荐的重要依据，请认真填写
        </div>
      </div>

      <div>
        <RequiredLabel>AIGC课程兴趣度</RequiredLabel>
        <div className="space-y-2">
          {[
            { label: '非常感兴趣', value: '4' },
            { label: '感兴趣', value: '3' },
            { label: '一般', value: '2' },
            { label: '不感兴趣', value: '1' },
          ].map((opt) =>
            renderOptionCard(`aigc-${opt.value}`, opt.label, formData.interest_aigc === opt.value, () => handleSingleSelect('interest_aigc', opt.value), <Heart size={16} />)
          )}
        </div>
      </div>

      <div>
        <RequiredLabel>编程课程兴趣度</RequiredLabel>
        <div className="space-y-2">
          {[
            { label: '非常感兴趣', value: '4' },
            { label: '感兴趣', value: '3' },
            { label: '一般', value: '2' },
            { label: '不感兴趣', value: '1' },
          ].map((opt) =>
            renderOptionCard(`prog-int-${opt.value}`, opt.label, formData.interest_programming === opt.value, () => handleSingleSelect('interest_programming', opt.value), <Code size={16} />)
          )}
        </div>
      </div>

      <div>
        <RequiredLabel>家中是否有电脑/平板</RequiredLabel>
        <div className="grid grid-cols-3 gap-3">
          {['有电脑', '有平板', '没有'].map((opt) =>
            renderOptionCard(`pc-${opt}`, opt, formData.has_computer === opt, () => handleSingleSelect('has_computer', opt), <Monitor size={16} />)
          )}
        </div>
      </div>

      <div>
        <RequiredLabel>家长支持程度</RequiredLabel>
        <div className="space-y-2">
          {['非常支持', '支持', '一般', '不太支持'].map((opt) =>
            renderOptionCard(`parent-${opt}`, opt, formData.parent_support === opt, () => handleSingleSelect('parent_support', opt), <Users size={16} />)
          )}
        </div>
      </div>

      <div>
        <RequiredLabel>每周可学习时间</RequiredLabel>
        <div className="grid grid-cols-3 gap-3">
          {['1-2小时', '3-5小时', '5小时以上'].map((opt) =>
            renderOptionCard(`time-${opt}`, opt, formData.learning_time === opt, () => handleSingleSelect('learning_time', opt), <Clock size={16} />)
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div>
        <RequiredLabel>逻辑思维能力自评</RequiredLabel>
        <div className="space-y-2">
          {['强（善于推理分析）', '中等（有一定基础）', '需培养（希望提升）'].map((opt) =>
            renderOptionCard(`logic-${opt}`, opt, formData.logical_ability === opt, () => handleSingleSelect('logical_ability', opt), <Brain size={16} />)
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">已学过的相关课程（可多选）</label>
        <div className="space-y-2">
          {['无', 'Scratch编程', 'Python编程', '机器人课程', '奥数/数学思维', '其他'].map((opt) =>
            renderMultiOptionCard(`prior-${opt}`, opt, formData.prior_courses.includes(opt), () => handleMultiSelect('prior_courses', opt))
          )}
        </div>
      </div>
    </div>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="glass-card rounded-3xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <User className="text-blue-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">个人中心</h1>
            <p className="text-sm text-slate-500">管理您的个人信息，用于智能组卷和课程推荐</p>
          </div>
        </div>

        {renderStepIndicator()}

        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">{steps[currentStep - 1].title}</h2>
          <p className="text-sm text-slate-500">请完成以下问题，带 <span className="text-red-500">*</span> 为必填项</p>
        </div>

        {stepContent[currentStep - 1]()}

        {saved && (
          <div className={`flex items-center gap-2 p-3 border rounded-2xl text-sm mt-6 ${
            isFirstTime
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <Check size={16} />
            {isFirstTime ? '保存成功，正在进入智能组卷...' : '保存成功！'}
          </div>
        )}

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => {
              if (currentStep === 1) {
                setIsViewMode(true);
              } else {
                setCurrentStep(Math.max(1, currentStep - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="btn-secondary flex items-center gap-2"
          >
            {currentStep === 1 ? <><X size={18} /> 取消</> : <><ChevronLeft size={18} /> 上一步</>}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => {
                setCurrentStep(currentStep + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              下一步
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!canProceed() || saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? '保存中...' : isFirstTime ? '保存信息' : '保存修改'}
            </button>
          )}
        </div>
      </div>

      {/* 二次确认弹窗 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Lock size={24} className="text-amber-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">确认保存</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              请确认您的个人信息填写无误，保存后将更新您的测评推荐结果。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 btn-secondary py-2.5"
              >
                再检查一下
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 btn-primary py-2.5 disabled:opacity-50"
              >
                {saving ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
