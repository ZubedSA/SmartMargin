import React from 'react';
import { formatCurrency } from '../utils/aiEngine';

const levelStyles = {
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  danger: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
  info: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
};

export default function AiInsightPanel({ insights, calc }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className={`text-xs px-3 py-2 rounded-lg border ${levelStyles[insight.level] || levelStyles.info} leading-relaxed`}
        >
          {insight.text}
        </div>
      ))}
    </div>
  );
}
