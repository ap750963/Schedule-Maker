import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, error, className = '', ...props }) => {
  return (
    <div className={`w-full group ${className}`}>
      {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-4">{label}</label>}
      <div className="relative">
        <input
          className={`
            block w-full text-lg font-bold text-gray-900 
            bg-white border-2 border-gray-100
            focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none
            disabled:bg-gray-50 disabled:text-gray-500
            ${icon ? 'pr-12' : 'pr-6'} pl-6 py-4
            placeholder:text-gray-300
            transition-all rounded-full shadow-sm
          `}
          {...props}
        />
        {icon && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600 ml-4">{error}</p>}
    </div>
  );
};