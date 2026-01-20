import React, { useMemo, useState } from 'react';
import { Plus, Clock, FolderOpen, Grid, Trash2, Users, Sparkles, BookOpen, AlertCircle, Palette, Check, Moon, Sun, X, UserCog, LayoutGrid } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { Schedule } from '../types.ts';
import { THEMES } from '../utils/index.ts';

interface HomeProps {
  schedules: Schedule[];
  onCreateNew: () => void;
  onSelectSchedule: (id: string) => void;
  onOpenMaster: () => void;
  onOpenFacultyWise: () => void;
  onOpenFacultyManagement: () => void;
  onDeleteSchedule: (id: string) => void;
  currentTheme: string;
  isDarkMode: boolean;
  onSetTheme: (theme: string) => void;
  onToggleDarkMode: () => void;
}

export const Home: React.FC<HomeProps> = ({ 
  schedules, onCreateNew, onSelectSchedule, onOpenMaster, onOpenFacultyWise, onOpenFacultyManagement, onDeleteSchedule,
  currentTheme, isDarkMode, onSetTheme, onToggleDarkMode
}) => {
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const groupedSchedules = useMemo<Record<string, Schedule[]>>(() => {
    const groups: Record<string, Schedule[]> = {};
    const sorted = [...schedules].sort((a, b) => b.lastModified - a.lastModified);

    sorted.forEach(schedule => {
        const sessionName = schedule.details.session || 'General Schedules';
        if (!groups[sessionName]) groups[sessionName] = [];
        groups[sessionName].push(schedule);
    });

    return groups;
  }, [schedules]);

  const confirmDelete = () => {
    if (scheduleToDelete) {
      onDeleteSchedule(scheduleToDelete.id);
      setScheduleToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 font-sans relative transition-colors duration-300 overflow-x-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="relative px-6 pt-12 pb-4 z-10">
        <div className="flex justify-between items-start max-w-7xl mx-auto w-full">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                ScholarTime<span className="text-primary-500">.</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">College Scheduling Expert ✨</p>
          </div>
          
          <div className="flex gap-2">
            <button 
                onClick={onOpenFacultyManagement}
                className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 border border-gray-100 dark:border-slate-700"
                title="Manage College Faculty"
            >
                <UserCog size={20} />
            </button>
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 border border-gray-100 dark:border-slate-700"
            >
                <Palette size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-8 relative z-10 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            {/* Main Action - Create New */}
            <button 
              onClick={onCreateNew}
              className="w-full bg-primary-500 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-glow hover:bg-primary-600 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 md:order-last"
            >
              <Plus size={22} strokeWidth={3} />
              Create New
            </button>

            {/* Master View */}
            <button 
              onClick={onOpenMaster}
              className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary-100 dark:hover:border-slate-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95 duration-200"
            >
              <LayoutGrid size={18} className="text-primary-500/80" />
              Master View
            </button>

            {/* Faculty View */}
            <button 
              onClick={onOpenFacultyWise}
              className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary-100 dark:hover:border-slate-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95 duration-200"
            >
              <Users size={18} className="text-primary-500/80" />
              Faculty Load
            </button>
        </div>

        {schedules.length === 0 && (
          <div className="text-center py-20 px-4 bg-white/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-800 h-24 w-24 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-soft border border-gray-100 dark:border-slate-700">
              <Sparkles className="h-8 w-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No schedules found</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">Start by adding your department details and semesters.</p>
          </div>
        )}

        {(Object.entries(groupedSchedules) as [string, Schedule[]][]).map(([session, sessionSchedules]) => (
            <div key={session} className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <FolderOpen size={14} className="text-primary-400" />
                    <h2 className="text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase">{session}</h2>
                    <div className="h-px bg-gray-100 dark:bg-slate-800 flex-1 ml-2 rounded-full" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sessionSchedules.map((schedule) => (
                    <div key={schedule.id} className="relative group">
                      <div 
                        onClick={() => onSelectSchedule(schedule.id)} 
                        className="h-full bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-slate-700 cursor-pointer group-hover:border-primary-100 dark:group-hover:border-primary-900/50 flex flex-col"
                      >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 px-3 py-1 rounded-full mb-3 inline-block">
                                    {schedule.details.semester} Sem • {schedule.details.level === '1st-year' ? 'Combined' : 'Dept'}
                                </span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-2 tracking-tight leading-snug">{schedule.details.className}</h3>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setScheduleToDelete(schedule); }} 
                                className="h-10 w-10 bg-gray-50 dark:bg-slate-700/50 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all sm:opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                            >
                                <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-auto pt-4 border-t border-gray-50 dark:border-slate-700/50">
                             <div className="flex gap-4">
                                <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(schedule.lastModified).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5"><BookOpen size={12} /> {schedule.subjects.length} Subj</span>
                             </div>
                          </div>
                      </div>
                    </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Appearance Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-modal border border-white/50 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Appearance</h3>
                    <button onClick={() => setShowSettings(false)} className="h-10 w-10 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500"><X size={20} /></button>
                </div>
                <div className="space-y-8">
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                           {isDarkMode ? <Moon size={20} className="text-primary-500" /> : <Sun size={20} className="text-primary-500" />}
                           <span className="text-base font-bold dark:text-white">Dark Mode</span>
                        </div>
                        <button onClick={onToggleDarkMode} className={`w-14 h-8 rounded-full transition-colors relative ${isDarkMode ? 'bg-primary-500' : 'bg-gray-300'}`}>
                            <div className={`h-6 w-6 bg-white rounded-full absolute top-1 transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Theme Palette</h4>
                        <div className="grid grid-cols-5 gap-3">
                            {Object.keys(THEMES).map(t => (
                                <button key={t} onClick={() => onSetTheme(t)} className={`aspect-square rounded-2xl border-4 flex items-center justify-center transition-all ${currentTheme === t ? 'border-primary-500 scale-110 shadow-lg shadow-primary-500/30' : 'border-transparent hover:scale-105 bg-gray-50 dark:bg-slate-700'}`} style={{ backgroundColor: currentTheme === t ? `rgb(${THEMES[t][500]})` : undefined }}>
                                    {currentTheme === t ? <Check size={20} strokeWidth={4} className="text-white" /> : <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `rgb(${THEMES[t][500]})` }} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {scheduleToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[3rem] p-10 text-center animate-modal border border-white/50 dark:border-slate-700">
                <div className="h-20 w-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                   <AlertCircle size={40} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black mb-2 dark:text-white tracking-tight">Delete Schedule?</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-10 font-medium leading-relaxed">Permanently remove <strong>{scheduleToDelete.details.className}</strong>?</p>
                <div className="flex flex-col gap-3">
                    <button 
                      onClick={confirmDelete}
                      className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all"
                    >
                      Delete Schedule
                    </button>
                    <button 
                      onClick={() => setScheduleToDelete(null)}
                      className="w-full py-4 text-gray-400 font-bold text-base hover:text-gray-600 dark:hover:text-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};