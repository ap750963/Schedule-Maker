import React, { useMemo } from 'react';
import { Plus, Calendar, Clock, ChevronRight, BookOpen, Sparkles, FolderOpen, Grid, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Schedule } from '../types';

interface HomeProps {
  schedules: Schedule[];
  onCreateNew: () => void;
  onSelectSchedule: (id: string) => void;
  onOpenMaster: () => void;
  onDeleteSchedule: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({ schedules, onCreateNew, onSelectSchedule, onOpenMaster, onDeleteSchedule }) => {
  
  // Group schedules by session
  const groupedSchedules = useMemo<Record<string, Schedule[]>>(() => {
    const groups: Record<string, Schedule[]> = {};
    
    // Sort schedules by modified date first (newest on top)
    const sorted = [...schedules].sort((a, b) => b.lastModified - a.lastModified);

    sorted.forEach(schedule => {
        const sessionName = schedule.details.session || 'General Schedules';
        if (!groups[sessionName]) {
            groups[sessionName] = [];
        }
        groups[sessionName].push(schedule);
    });

    return groups;
  }, [schedules]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans relative overflow-hidden">
      
      {/* Decorative Background Blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-60 animate-float pointer-events-none" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50 animate-float pointer-events-none" style={{ animationDelay: '1s' }} />

      {/* Header */}
      <div className="relative px-6 pt-12 pb-2 z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Schedule<span className="text-primary-500">.</span>
            </h1>
            <p className="text-gray-500 font-medium">Let's get organized ✨</p>
          </div>
          {/* Calendar icon removed as requested */}
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto w-full space-y-10 relative z-10">
        {/* Empty State */}
        {schedules.length === 0 && (
          <div className="text-center py-20 px-4 animate-fade-in-up">
            <div className="bg-white h-40 w-40 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-soft rotate-3 hover:rotate-0 transition-transform duration-500">
              <Sparkles className="h-16 w-16 text-primary-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No schedules yet</h3>
            <p className="text-gray-400 mb-10 max-w-xs mx-auto leading-relaxed font-medium">
              Create your first timetable to track classes and faculties with style.
            </p>
            <Button onClick={onCreateNew} size="lg" icon={<Plus size={20} />} className="rounded-full shadow-glow">
              Create New Schedule
            </Button>
          </div>
        )}

        {/* Master View Button */}
        {schedules.length > 0 && (
            <div className="animate-fade-in-up">
                <Button 
                    onClick={onOpenMaster} 
                    fullWidth 
                    variant="secondary" 
                    icon={<Grid size={18} />}
                    className="shadow-sm border-gray-200"
                >
                    Open Department Master View
                </Button>
            </div>
        )}

        {/* Schedule Groups */}
        {(Object.entries(groupedSchedules) as [string, Schedule[]][]).map(([session, sessionSchedules], groupIndex) => (
            <div key={session} className="animate-fade-in-up" style={{ animationDelay: `${groupIndex * 150}ms` }}>
                <div className="flex items-center gap-2 mb-4 px-2">
                    <FolderOpen size={18} className="text-primary-400" />
                    <h2 className="text-lg font-black text-gray-800 tracking-wide uppercase">{session}</h2>
                    <div className="h-px bg-gray-200 flex-1 ml-2 rounded-full" />
                </div>
                
                <div className="grid gap-5">
                    {sessionSchedules.map((schedule, i) => (
                    <div
                        key={schedule.id}
                        onClick={() => onSelectSchedule(schedule.id)}
                        className="group relative bg-white p-6 rounded-[2rem] shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 text-left w-full border border-transparent hover:border-primary-100 cursor-pointer"
                    >
                        <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    {schedule.details.semester || 'N/A'} Sem
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">
                            {schedule.details.className}
                            </h3>
                            <div className="inline-flex items-center mt-2 px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                            Section {schedule.details.section}
                            </div>
                        </div>
                        
                        {/* Delete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSchedule(schedule.id);
                            }}
                            className="absolute top-6 right-6 h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all duration-300 z-20"
                            title="Delete Schedule"
                        >
                            <Trash2 size={18} strokeWidth={2.5} />
                        </button>

                        </div>
                        
                        <div className="mt-8 flex items-center justify-between text-xs font-semibold text-gray-400">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Clock size={14} />
                                <span>{new Date(schedule.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <BookOpen size={14} />
                                <span>{schedule.subjects.length} Subjects</span>
                            </div>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Floating Action Button */}
      {schedules.length > 0 && (
        <div className="fixed bottom-8 right-8 z-30">
          <button
            onClick={onCreateNew}
            className="h-16 w-16 bg-primary-600 rounded-3xl text-white shadow-glow flex items-center justify-center hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
};