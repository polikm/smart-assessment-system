import { type ReactNode } from 'react';
import { useTheme } from './ThemeProvider';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {title}
        </h1>
        {description && (
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex gap-3">{children}</div>}
    </div>
  );
}
