import React, { useMemo, useState } from 'react';
import { Plus, Clock, FolderOpen, Grid, Trash2, Users, Sparkles, BookOpen, AlertCircle, X } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { Schedule } from '../types.ts';

interface HomeProps {
  schedules: Schedule[];
  onCreateNew: () => void;
  onSelectSchedule: (id: string) => void;
  onOpenMaster: () => void;
  onOpenFacultyWise: () => void;
  onDeleteSchedule: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({ schedules, onCreateNew, onSelectSchedule, onOpenMaster, onOpenFacultyWise, onDeleteSchedule }) => {
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  
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
    <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
      <div className="relative px-6 pt-12 pb-2 z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Schedule<span className="text-primary-600">.</span>
            </h1>
            <p className="text-slate-600 font-medium">Let's get organized ✨</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto w-full space-y-4 relative z-10">
        {schedules.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="bg-white h-40 w-40 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-soft border border-gray-100">
              <Sparkles className="h-16 w-16 text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No schedules yet</h3>
            <p className="text-slate-500 mb-10 max-w-xs mx-auto leading-relaxed font-medium">Create your first timetable to track classes and faculties with style.</p>
            <Button onClick={onCreateNew} size="lg" icon={<Plus size={20} />} className="rounded-full shadow-glow">Create New Schedule</Button>
          </div>
        )}

        {schedules.length > 0 && (
            <div className="grid grid-cols-1 gap-3 mb-6">
                <Button onClick={onOpenMaster} fullWidth variant="secondary" icon={<Grid size={18} />} className="shadow-sm border-gray-200 text-slate-700">Master Department View</Button>
                <Button onClick={onOpenFacultyWise} fullWidth variant="secondary" icon={<Users size={18} />} className="shadow-sm border-gray-200 text-slate-700">Faculty Timetables</Button>
            </div>
        )}

        {(Object.entries(groupedSchedules) as [string, Schedule[]][]).map(([session, sessionSchedules]) => (
            <div key={session} className="pt-6">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <FolderOpen size={18} className="text-primary-500" />
                    <h2 className="text-sm font-black text-slate-800 tracking-widest uppercase">{session}</h2>
                    <div className="h-px bg-gray-200 flex-1 ml-2 rounded-full" />
                </div>
                
                <div className="grid gap-5">
                    {sessionSchedules.map((schedule) => (
                    <div key={schedule.id} className="relative group">
                      {/* Interactive Card Surface */}
                      <div 
                        onClick={() => onSelectSchedule(schedule.id)} 
                        className="bg-white p-6 rounded-[2rem] shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-primary-200 cursor-pointer"
                      >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-14">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full border border-primary-100">{schedule.details.semester} Sem</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-1">{schedule.details.className}</h3>
                                <div className="inline-flex items-center mt-2 px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wide">Section {schedule.details.section}</div>
                            </div>
                          </div>
                          <div className="mt-8 flex items-center justify-between text-xs font-bold text-slate-400">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5"><Clock size={14} /><span>{new Date(schedule.lastModified).toLocaleDateString()}</span></div>
                                <div className="flex items-center gap-1.5"><BookOpen size={14} /><span>{schedule.subjects.length} Subjects</span></div>
                            </div>
                          </div>
                      </div>

                      {/* Absolute Delete Button Overlay */}
                      <button 
                          type="button"
                          onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              setScheduleToDelete(schedule);
                          }} 
                          className="absolute top-6 right-6 h-12 w-12 bg-white rounded-full flex items-center justify-center text-red-500 border border-gray-100 shadow-sm hover:bg-red-50 hover:text-red-700 hover:scale-110 active:scale-90 transition-all z-20"
                          title="Delete Schedule"
                      >
                          <Trash2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {schedules.length > 0 && (
        <div className="fixed bottom-8 right-8 z-30">
          <button onClick={onCreateNew} className="h-16 w-16 bg-primary-600 rounded-3xl text-white shadow-glow flex items-center justify-center hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all"><Plus size={32} strokeWidth={2.5} /></button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {scheduleToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300">
            <div 
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-modal border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
                        <AlertCircle size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">Delete Schedule?</h3>
                        <p className="text-slate-500 font-medium mt-2 leading-relaxed">
                            Are you sure you want to delete <span className="text-slate-900 font-bold">"{scheduleToDelete.details.className} - {scheduleToDelete.details.semester} Sem"</span>?
                            <br/>
                            <span className="text-xs uppercase tracking-widest text-red-400 font-black mt-4 block">This action is permanent</span>
                        </p>
                    </div>
                    <div className="w-full flex flex-col space-y-3 pt-4">
                        <Button 
                            variant="danger" 
                            fullWidth 
                            onClick={confirmDelete}
                            className="rounded-2xl py-4 text-red-700 bg-red-50 border-red-100 hover:bg-red-500 hover:text-white"
                        >
                            Delete Permanently
                        </Button>
                        <Button 
                            variant="ghost" 
                            fullWidth 
                            onClick={() => setScheduleToDelete(null)}
                            className="rounded-2xl py-4 text-slate-500 font-bold"
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