import React from 'react';

interface DifficultyBadgeProps {
  level: number;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  level,
  showName = true,
  size = 'md',
}) => {
  const configs: Record<number, { name: string; color: string; bg: string; border: string }> = {
    1: { name: 'Very Easy', color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-700/60' },
    2: { name: 'Easy', color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-700/60' },
    3: { name: 'Medium', color: 'text-indigo-400', bg: 'bg-indigo-950/60', border: 'border-indigo-700/60' },
    4: { name: 'Hard', color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-700/60' },
    5: { name: 'Very Hard', color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-700/60' },
  };

  const current = configs[level] || configs[3];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${current.bg} ${current.border} ${current.color} ${sizeClasses[size]}`}
    >
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      <span>LEVEL {level}</span>
      {showName && <span className="opacity-80 font-normal">({current.name})</span>}
    </span>
  );
};
