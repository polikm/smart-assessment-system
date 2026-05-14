import { useTheme } from './ThemeProvider';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, color }: StatCardProps) {
  const { isDark } = useTheme();

  return (
    <div className={`rounded-2xl p-6 border transition-all duration-200 hover:shadow-md ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {value}
        </p>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </p>
      </div>
    </div>
  );
}

interface StatCardsProps {
  cards: StatCardProps[];
}

export default function StatCards({ cards }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
}
