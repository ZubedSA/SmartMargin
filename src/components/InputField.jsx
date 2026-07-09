import React from 'react';

/**
 * Reusable input field component for the calculator
 */
export default function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  prefix,
  suffix,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-slate-400 text-sm font-medium pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl
            text-slate-900 dark:text-white text-sm font-medium
            transition-all duration-200
            placeholder:text-slate-400 dark:placeholder:text-slate-600
            focus:outline-none focus:border-violet-500/70 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-violet-500/20
            hover:border-slate-300 dark:hover:border-slate-600/70
            ${prefix ? 'pl-8' : 'pl-3'}
            ${suffix ? 'pr-8' : 'pr-3'}
            py-2.5
          `}
        />
        {suffix && (
          <span className="absolute right-3 text-slate-400 text-sm pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
