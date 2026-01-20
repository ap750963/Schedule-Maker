import React, { useMemo, useState } from 'react';
import { Plus, Clock, FolderOpen, Grid, Trash2, Users, Sparkles, BookOpen, AlertCircle, Palette, Check, Moon, Sun, X } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { Schedule } from '../types.ts';
import { THEMES } from '../utils/index.ts';

interface HomeProps {
  schedules: Schedule[];
  onCreateNew: () => void;
  onSelectSchedule: (id: string) => void;
  onOpenMaster: () => void;
  onOpenFacultyWise: () => void;
  onDeleteSchedule: (id: string) => void;
  currentTheme: string;
  isDarkMode: boolean;
  onSetTheme: (theme: string) => void;
  onToggleDarkMode: () => void;
}

export const Home: React.FC<HomeProps> = ({ 
  schedules, onCreateNew, onSelectSchedule, onOpenMaster, onOpenFacultyWise, onDeleteSchedule,
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
      {/* Ambient Background Blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="relative px-5 pt-8 pb-2 z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Schedule<span className="text-primary-600">.</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium pl-1">Let's get organized ✨</p>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md transition-all text-slate-500 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <Palette size={20} />
          </button>
        </div>
      </div>

      <div className="p-5 max-w-lg mx-auto w-full space-y-4 relative z-10">
        {schedules.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="bg-white dark:bg-slate-800 h-32 w-32 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-soft border border-gray-100 dark:border-slate-700 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary-50 to-transparent dark:from-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="h-12 w-12 text-primary-400 relative z-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No schedules yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed font-medium">Create your first timetable to track classes and faculties with style.</p>
            <Button onClick={onCreateNew} size="lg" icon={<Plus size={18} />} className="rounded-full shadow-glow">Create New Schedule</Button>
          </div>
        )}

        {schedules.length > 0 && (
            <div className="grid grid-cols-1 gap-3 mb-6">
                <Button onClick={onOpenMaster} fullWidth variant="secondary" icon={<Grid size={16} />} className="shadow-sm border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 text-sm rounded-full">Master Department View</Button>
                <Button onClick={onOpenFacultyWise} fullWidth variant="secondary" icon={<Users size={16} />} className="shadow-sm border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 text-sm rounded-full">Faculty Timetables</Button>
            </div>
        )}

        {(Object.entries(groupedSchedules) as [string, Schedule[]][]).map(([session, sessionSchedules]) => (
            <div key={session} className="pt-4">
                <div className="flex items-center gap-2 mb-3 px-2">
                    <FolderOpen size={16} className="text-primary-500" />
                    <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-widest uppercase">{session}</h2>
                    <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1 ml-2 rounded-full" />
                </div>
                
                <div className="grid gap-4">
                    {sessionSchedules.map((schedule) => (
                    <div key={schedule.id} className="relative group">
                      <div 
                        onClick={() => onSelectSchedule(schedule.id)} 
                        className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 cursor-pointer relative overflow-hidden"
                      >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 dark:bg-primary-900/10 rounded-bl-[3rem] -mr-6 -mt-6 pointer-events-none transition-transform group-hover:scale-110" />
                          
                          <div className="flex justify-between items-start relative z-10">
                            <div className="flex-1 pr-12">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full border border-primary-100 dark:border-primary-800">{schedule.details.semester} Sem</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-1">{schedule.details.className}</h3>
                                <div className="inline-flex items-center mt-2 px-3 py-1 bg-gray-50 dark:bg-slate-700/50 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Section {schedule.details.section}</div>
                            </div>
                          </div>
                          <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1"><Clock size={12} /><span>{new Date(schedule.lastModified).toLocaleDateString()}</span></div>
                                <div className="flex items-center gap-1"><BookOpen size={12} /><span>{schedule.subjects.length} Subjects</span></div>
                            </div>
                          </div>
                      </div>

                      <button 
                          type="button"
                          onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setScheduleToDelete(schedule);
                          }} 
                          className="absolute top-4 right-4 h-9 w-9 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 border border-gray-100 dark:border-slate-600 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 hover:scale-110 active:scale-90 transition-all z-20"
                      >
                          <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {schedules.length > 0 && (
        <div className="fixed bottom-6 right-6 z-30">
          <button onClick={onCreateNew} className="h-14 w-14 bg-primary-600 rounded-full text-white shadow-glow flex items-center justify-center hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all"><Plus size={24} strokeWidth={2.5} /></button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300" onClick={() => setShowSettings(false)}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 animate-modal border border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5 px-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Appearance</h3>
                    <button onClick={() => setShowSettings(false)} className="h-8 w-8 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-5">
                    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-full flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-white dark:bg-slate-600 rounded-full flex items-center justify-center text-slate-700 dark:text-white shadow-sm">
                                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Dark Mode</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Easier on the eyes</p>
                            </div>
                        </div>
                        <button 
                            onClick={onToggleDarkMode}
                            className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'}`}
                        >
                            <div className={`h-5 w-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${isDarkMode ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-3 px-1 uppercase tracking-widest">Theme Colors</h4>
                        <div className="grid grid-cols-5 gap-3">
                            {Object.keys(THEMES).map((theme) => {
                                const rgb = THEMES[theme][500];
                                return (
                                    <button 
                                        key={theme}
                                        onClick={() => onSetTheme(theme)}
                                        className="aspect-square rounded-full flex items-center justify-center transition-transform active:scale-95 hover:scale-105 relative"
                                        style={{ backgroundColor: `rgb(${rgb})` }}
                                    >
                                        {currentTheme === theme && (
                                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
                                                <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {scheduleToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300">
            <div 
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 animate-modal border border-slate-100 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-16 w-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 mb-1">
                        <AlertCircle size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Delete Schedule?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 leading-relaxed">
                            Are you sure you want to delete <span className="text-slate-900 dark:text-white font-bold">"{scheduleToDelete.details.className}"</span>?
                            <br/>
                            <span className="text-[10px] uppercase tracking-widest text-red-400 font-black mt-3 block">This action is permanent</span>
                        </p>
                    </div>
                    <div className="w-full flex flex-col space-y-2.5 pt-3">
                        <Button 
                            variant="danger" 
                            fullWidth 
                            onClick={confirmDelete}
                            className="rounded-full py-3 text-sm"
                        >
                            Delete Permanently
                        </Button>
                        <Button 
                            variant="ghost" 
                            fullWidth 
                            onClick={() => setScheduleToDelete(null)}
                            className="rounded-full py-3 text-sm text-slate-500 font-bold dark:text-slate-400"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};