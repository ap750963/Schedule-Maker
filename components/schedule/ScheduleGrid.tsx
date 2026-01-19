import React from 'react';
import { Coffee, Edit2, Plus, User, Clock, MoreHorizontal } from 'lucide-react';
import { DAYS, Period, Subject, Schedule, TimeSlot } from '../../types';
import { getColorClasses, getSubjectColorName, getFacultyInitials } from '../../utils';

interface ScheduleGridProps {
  schedule: Schedule;
  periods: Period[];
  onCellClick: (day: string, periodId: number) => void;
  onPeriodClick: (period: Period) => void;
  onAddPeriod: () => void;
}

const BREAK_LETTERS = ['B', 'R', 'E', 'A', 'K', 'S'];

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ 
  schedule, periods, onCellClick, onPeriodClick, onAddPeriod 
}) => {
  const findSlot = (day: string, period: number) => 
    schedule.timeSlots.find(s => s.day === day && s.period === period);

  const getSub = (id: string) => schedule.subjects.find(s => s.id === id);

  return (
    <div id="schedule-grid" className="min-w-fit h-full flex flex-col p-4">
      {/* Header Row */}
      <div className="flex gap-4 mb-4 sticky top-0 z-40">
        {/* Empty corner for Days */}
        <div className="w-20 shrink-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] border border-white/20 dark:border-slate-700/30 flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Day</span>
        </div>

        {/* Time Periods */}
        {periods.map(p => (
          <div 
            key={p.id} 
            onClick={() => onPeriodClick(p)} 
            className={`
              shrink-0 relative group cursor-pointer transition-all duration-300 hover:-translate-y-1
              bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] border border-white/20 dark:border-slate-700/30 shadow-sm hover:shadow-lg
              ${p.isBreak ? 'w-16 bg-gray-50/50 dark:bg-slate-800/50' : 'w-48'}
            `}
          >
            {p.isBreak ? (
              <div className="h-full flex flex-col items-center justify-center gap-1 py-4">
                <Coffee size={16} className="text-gray-400 dark:text-slate-500 mb-1" />
                <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest rotate-90 mt-2">Break</span>
                <Edit2 size={10} className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"/>
              </div>
            ) : (
              <div className="flex flex-col h-full items-center justify-center gap-1 py-4 px-2">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={12} className="text-gray-400 dark:text-slate-500" />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 font-mono tracking-tighter uppercase">{p.label}</span>
                </div>
                <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl px-3 py-1.5 border border-white/40 dark:border-slate-600/30 shadow-sm group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
                    <span className="text-xs font-black text-gray-700 dark:text-slate-200">{p.time}</span>
                </div>
                <Edit2 size={12} className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"/>
              </div>
            )}
          </div>
        ))}
        
        {/* Add Period Button */}
        <div className="w-16 shrink-0 flex items-center justify-center">
          <button 
            onClick={onAddPeriod} 
            className="h-14 w-14 rounded-[1.5rem] bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 text-gray-400 dark:text-slate-500 transition-all shadow-sm hover:shadow-glow hover:scale-110 flex items-center justify-center"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Grid Rows */}
      <div className="flex flex-col gap-4">
        {DAYS.map((day, dIdx) => (
          <div key={day} className="flex gap-4 min-h-[10rem] group/row">
            {/* Day Label (Sticky) */}
            <div className="sticky left-0 z-30 w-20 shrink-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-[2rem] flex items-center justify-center shadow-card group-hover/row:scale-105 transition-transform duration-300">
              <div className="rotate-[-90deg] text-lg font-black text-gray-300 dark:text-slate-600 uppercase tracking-[0.3em] group-hover/row:text-primary-500 transition-colors whitespace-nowrap drop-shadow-sm">
                {day}
              </div>
            </div>

            {/* Slots */}
            {periods.map((period, pIdx) => {
              if (period.isBreak) {
                const letter = BREAK_LETTERS[dIdx] || '•';
                return (
                  <div key={`${day}-${period.id}`} className="w-16 shrink-0 flex items-center justify-center select-none">
                    <span className="text-2xl font-black text-gray-200 dark:text-slate-700 font-sans">{letter}</span>
                  </div>
                );
              }

              // Handle Multi-hour Practical spanning
              if (pIdx > 0) {
                const prev = findSlot(day, periods[pIdx-1].id);
                if (prev?.type === 'Practical' && (prev.duration || 1) > 1) return null;
              }

              const slot = findSlot(day, period.id);
              const color = getSubjectColorName(schedule.subjects, slot?.subjectId || '');
              const styles = getColorClasses(color);

              return (
                <div 
                  key={`${day}-${period.id}`} 
                  onClick={() => onCellClick(day, period.id)} 
                  className={`
                    shrink-0 relative transition-all duration-300
                    ${slot?.type === 'Practical' && (slot.duration || 1) > 1 ? 'w-[calc(24rem+1rem)]' : 'w-48'}
                  `}
                >
                  <div className={`
                    h-full w-full rounded-[2rem] flex flex-col relative overflow-hidden backdrop-blur-md border transition-all duration-300
                    ${slot 
                      ? `${styles.bg} ${styles.border} ${styles.hover} shadow-sm` 
                      : 'bg-white/20 dark:bg-slate-800/20 border-white/20 dark:border-slate-700/20 border-dashed hover:border-primary-300/50 hover:bg-white/40 dark:hover:bg-slate-700/40 justify-center items-center group/cell'
                    }
                  `}>
                    {slot ? (
                      <div className="p-5 h-full flex flex-col justify-between relative z-10">
                        {/* Top: Tag + Code */}
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm ${styles.pill}`}>
                            {slot.type === 'Practical' ? 'Lab' : 'Theory'}
                          </span>
                          <span className={`text-[10px] font-bold opacity-60 ${styles.text}`}>
                            {getSub(slot.subjectId)?.code}
                          </span>
                        </div>

                        {/* Middle: Subject Name */}
                        <h4 className={`text-base font-black leading-tight line-clamp-2 drop-shadow-sm ${styles.text}`}>
                          {getSub(slot.subjectId)?.name}
                        </h4>

                        {/* Bottom: Faculty */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                          <div className={`p-1 rounded-full ${styles.pill}`}>
                            <User size={10} className={styles.icon} strokeWidth={3} />
                          </div>
                          <span className={`text-xs font-bold truncate ${styles.lightText}`}>
                            {getFacultyInitials(schedule.faculties, slot.facultyIds)}
                          </span>
                        </div>

                        {/* Decorative Background Icon */}
                        <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-black dark:text-white pointer-events-none transform rotate-12">
                           <User size={80} />
                        </div>
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover/cell:opacity-100 transition-all duration-300 transform group-hover/cell:scale-110 flex flex-col items-center">
                        <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-500 mb-2 shadow-sm">
                          <Plus size={20} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Add Class</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};