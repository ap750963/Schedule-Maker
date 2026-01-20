import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, error, className = '', placeholder, ...props }) => {
  return (
    <div className={`w-full group ${className}`}>
      <div className="relative">
        <input
          placeholder={placeholder || label}
          className={`
            block w-full text-sm font-semibold text-gray-900 dark:text-white
            bg-gray-50/50 dark:bg-slate-900/50
            border-2 border-gray-100 dark:border-slate-800
            focus:border-primary-500 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:outline-none
            disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-slate-900 dark:disabled:text-gray-600
            ${icon ? 'pr-12' : 'pr-4'} pl-5 py-4
            placeholder:text-gray-400 dark:placeholder:text-slate-600 placeholder:font-medium placeholder:uppercase placeholder:text-xs placeholder:tracking-wider
            transition-all rounded-2xl shadow-sm
          `}
          {...props}
        />
        {icon && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-slate-600 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors">
            {React.cloneElement(icon as React.ReactElement, { size: 20 })}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 ml-4">{error}</p>}
    </div>
  );
};