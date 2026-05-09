import { useNavigate } from 'react-router-dom';
import { FileText, Home, AlertCircle } from 'lucide-react';

export default function InfoRequiredModal() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-amber-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">请先完善个人信息</h2>
        <p className="text-slate-500 mb-6">
          完成个人信息登记后，才能开始测评并查看报告。我们需要了解您的基本情况，以便为您生成合适的测评试卷。
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/student')}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Home size={16} />
            返回首页
          </button>
          <button
            onClick={() => navigate('/student/info')}
            className="flex-1 btn-primary flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600"
          >
            <FileText size={16} />
            去完善信息
          </button>
        </div>
      </div>
    </div>
  );
}
