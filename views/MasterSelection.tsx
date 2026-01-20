import React from 'react';
import { ChevronLeft, Users, Building2, Sparkles } from 'lucide-react';

interface MasterSelectionProps {
  onSelect: (level: '1st-year' | 'higher-year') => void;
  onBack: () => void;
}

export const MasterSelection: React.FC<MasterSelectionProps> = ({ onSelect, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] bg-primary-100 dark:bg-primary-900/10 rounded-full blur-[100px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-20 -left-20 w-[30rem] h-[30rem] bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-[80px] opacity-40 pointer-events-none" />

      <div className="px-6 py-8 flex items-center gap-4 relative z-10">
          <button 
            onClick={onBack} 
            className="h-12 w-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 hover:text-primary-600 transition-all shadow-sm border border-gray-100 dark:border-slate-700"
          >
              <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-black dark:text-white tracking-tight">Master View Choice</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 relative z-10">
        <div className="text-center mb-4 max-w-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
             <Sparkles size={12} /> View Mode
          </div>
          <p className="text-gray-400 dark:text-slate-500 font-medium">Which master timetable structure would you like to view and manage?</p>
        </div>

        <div className="grid gap-6 w-full max-w-md">
          <button 
            onClick={() => onSelect('1st-year')}
            className="group relative bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-soft border border-gray-100 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Users size={120} strokeWidth={1} />
            </div>
            <div className="h-16 w-16 bg-primary-50 dark:bg-primary-900/30 rounded-[1.5rem] flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 group-hover:scale-110 transition-transform">
               <Users size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">1st Year (Combined)</h3>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2 font-medium leading-relaxed">Manage the unified common master view for all introductory batches.</p>
          </button>

          <button 
            onClick={() => onSelect('higher-year')}
            className="group relative bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-soft border border-gray-100 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Building2 size={120} strokeWidth={1} />
            </div>
            <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-[1.5rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
               <Building2 size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Department Master</h3>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2 font-medium leading-relaxed">View all branch-wise schedules (2nd & 3rd Year) in a single consolidated grid.</p>
          </button>
        </div>
      </div>
    </div>
  );
};