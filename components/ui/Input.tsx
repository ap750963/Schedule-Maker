import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, error, className = '', ...props }) => {
  return (
    <div className={`w-full group ${className}`}>
      {label && <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-4">{label}</label>}
      <div className="relative">
        <input
          className={`
            block w-full text-sm font-bold text-gray-900 dark:text-white
            bg-white dark:bg-slate-800 
            border-2 border-gray-100 dark:border-slate-700
            focus:border-primary-500 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:outline-none
            disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-slate-900 dark:disabled:text-gray-600
            ${icon ? 'pr-12' : 'pr-6'} pl-6 py-2.5
            placeholder:text-gray-300 dark:placeholder:text-slate-600
            transition-all rounded-full shadow-sm
          `}
          {...props}
        />
        {icon && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors">
            {React.cloneElement(icon as React.ReactElement, { size: 18 })}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400 ml-4">{error}</p>}
    </div>
  );
};