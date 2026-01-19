
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
  value: string;
  label: React.ReactNode;
  dropdownLabel?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label, value, onChange, options, placeholder = 'Select...', icon, disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="w-full group relative" ref={containerRef}>
      {label && <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">{label}</label>}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full text-left bg-white border-2 
          ${isOpen ? 'border-primary-500 ring-4 ring-primary-100' : 'border-gray-100 hover:border-primary-200'} 
          rounded-2xl py-4 pl-5 pr-12 
          text-lg font-bold text-gray-900 
          transition-all outline-none 
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
        `}
      >
        <span className={`block truncate ${!selectedOption ? 'text-gray-300' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-gray-400 group-hover:text-primary-500 transition-colors">
            {icon || <ChevronDown size={20} strokeWidth={3} />}
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 max-h-60 overflow-auto no-scrollbar animate-fade-in-up origin-top p-2">
          {options.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm font-bold">No options available</div>
          ) : (
            <div className="space-y-1">
                {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                        if (!option.disabled) {
                            onChange(option.value);
                            setIsOpen(false);
                        }
                    }}
                    className={`
                    w-full text-left px-4 py-3 rounded-xl flex items-center justify-between
                    transition-colors
                    ${option.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-primary-50 cursor-pointer'}
                    ${option.value === value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}
                    `}
                >
                    <span className={`font-bold text-sm flex-1 mr-2 ${option.value === value ? 'text-primary-900' : ''}`}>
                        {option.dropdownLabel || option.label}
                    </span>
                    {option.value === value && <Check size={16} className="text-primary-600 shrink-0" />}
                </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
