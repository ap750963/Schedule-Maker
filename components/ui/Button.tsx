import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  icon,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-bold tracking-wide transition-all focus:outline-none focus:ring-4 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 duration-200";
  
  const variants = {
    // Changed from primary-700 to primary-500 for lighter theme
    primary: "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-200 shadow-glow shadow-primary-500/40",
    secondary: "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 focus:ring-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700",
    outline: "bg-transparent border-2 border-primary-200 text-primary-600 hover:bg-primary-50 focus:ring-primary-100",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 focus:ring-gray-100 dark:text-gray-400 dark:hover:bg-slate-800",
    danger: "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 focus:ring-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-5 py-3 text-sm rounded-2xl",
    lg: "px-6 py-4 text-base rounded-[1.25rem]",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {/* Icon handling: if icon provided, layout changes slightly */}
      {icon && <span className={children ? "mr-2.5" : ""}>{icon}</span>}
      {children}
    </button>
  );
};