import React, { useMemo, useState } from 'react';
import { Plus, Clock, FolderOpen, Grid, Trash2, Users, Sparkles, BookOpen, AlertCircle, Palette, Check, Moon, Sun, X, UserCog } from 'lucide-react';
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

      <div className="relative px-5 pt-8 pb-2 z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ScholarTime<span className="text-primary-600">.</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium pl-1">College Scheduling Expert ✨</p>
          </div>
          
          <div className="flex gap-2">
            <button 
                onClick={onOpenFacultyManagement}
                className="p-2.5 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md transition-all text-slate-500 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
                title="Manage College Faculty"
            >
                <UserCog size={20} />
            </button>
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md transition-all text-slate-500 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
            >
                <Palette size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 max-w-lg mx-auto w-full space-y-4 relative z-10">
        <div className="grid grid-cols-1 gap-3 mb-6">
            <Button onClick={onCreateNew} fullWidth icon={<Plus size={18} />} className="shadow-glow py-4 rounded-2xl">Create New Schedule</Button>
            {schedules.length > 0 && (
                <>
                    <Button onClick={onOpenMaster} fullWidth variant="secondary" icon={<Grid size={16} />} className="shadow-sm">Master Department View</Button>
                    <Button onClick={onOpenFacultyWise} fullWidth variant="secondary" icon={<Users size={16} />} className="shadow-sm">Faculty Timetables</Button>
                </>
            )}
        </div>

        {schedules.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="bg-white dark:bg-slate-800 h-28 w-28 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-soft border border-gray-100 dark:border-slate-700">
              <Sparkles className="h-10 w-10 text-primary-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No schedules found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">Start by adding your department details and semesters.</p>
          </div>
        )}

        {(Object.entries(groupedSchedules) as [string, Schedule[]][]).map(([session, sessionSchedules]) => (
            <div key={session} className="pt-4">
                <div className="flex items-center gap-2 mb-3 px-2">
                    <FolderOpen size={16} className="text-primary-500" />
                    <h2 className="text-[10px] font-black text-slate-800 dark:text-slate-200 tracking-widest uppercase">{session}</h2>
                    <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1 ml-2 rounded-full" />
                </div>
                
                <div className="grid gap-3">
                    {sessionSchedules.map((schedule) => (
                    <div key={schedule.id} className="relative group">
                      <div 
                        onClick={() => onSelectSchedule(schedule.id)} 
                        className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-slate-700 cursor-pointer"
                      >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full mb-2 inline-block">
                                    {schedule.details.semester} Sem • {schedule.details.level === '1st-year' ? 'Combined' : 'Dept'}
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{schedule.details.className}</h3>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setScheduleToDelete(schedule); }} 
                                className="h-8 w-8 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                             <div className="flex gap-3">
                                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(schedule.lastModified).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><BookOpen size={10} /> {schedule.subjects.length} Subjects</span>
                             </div>
                          </div>
                      </div>
                    </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Settings Modal - Redacted for brevity as it remains same */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowSettings(false)}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-modal" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Appearance</h3>
                    <button onClick={() => setShowSettings(false)} className="h-8 w-8 text-gray-500"><X size={16} /></button>
                </div>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold dark:text-white">Dark Mode</span>
                        <button onClick={onToggleDarkMode} className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-primary-500' : 'bg-gray-300'}`}>
                            <div className={`h-5 w-5 bg-white rounded-full absolute top-1 transition-all ${isDarkMode ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Theme Color</h4>
                        <div className="grid grid-cols-5 gap-2">
                            {Object.keys(THEMES).map(t => (
                                <button key={t} onClick={() => onSetTheme(t)} className={`aspect-square rounded-xl border-2 flex items-center justify-center ${currentTheme === t ? 'border-primary-500' : 'border-transparent'}`} style={{ backgroundColor: `rgb(${THEMES[t][500]})` }}>
                                    {currentTheme === t && <Check size={14} className="text-white" />}
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-8 text-center animate-modal">
                <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-black mb-2 dark:text-white">Delete Timetable?</h3>
                <p className="text-sm text-gray-500 mb-8 font-medium">This will permanently remove the schedule for <strong>{scheduleToDelete.details.className}</strong>.</p>
                <div className="flex flex-col gap-2">
                    <Button variant="danger" fullWidth onClick={confirmDelete}>Delete Schedule</Button>
                    <Button variant="ghost" fullWidth onClick={() => setScheduleToDelete(null)}>Cancel</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
