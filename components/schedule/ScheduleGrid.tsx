
import React from 'react';
import { Coffee, Edit2, Plus, User } from 'lucide-react';
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
    <div id="schedule-grid" className="min-w-fit h-full flex flex-col p-4 bg-white/60"> 
      <div className="sticky top-0 z-30 flex border-b border-gray-100 bg-white/95 backdrop-blur-xl shadow-sm min-w-max rounded-t-2xl">
        <div className="w-24 shrink-0 border-r border-gray-100 bg-white/50 flex items-center justify-center py-4">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Day</span>
        </div>
        {periods.map(p => (
          <div key={p.id} onClick={() => onPeriodClick(p)} className={`shrink-0 py-4 px-2 text-center group cursor-pointer border-r border-gray-50 hover:bg-gray-50/80 transition-colors relative ${p.isBreak ? 'w-20 bg-gray-50' : 'w-40'}`}>
            {p.isBreak ? (
              <div className="h-full flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Break</span>
                <Edit2 size={10} className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"/>
              </div>
            ) : (
              <div className="flex flex-col h-full items-center justify-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="block text-xs font-bold text-gray-500 font-mono bg-gray-50 rounded-md px-3 py-1.5 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-all">{p.time}</span>
                  <Edit2 size={12} className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="w-20 shrink-0 flex items-center justify-center">
          <button onClick={onAddPeriod} className="h-10 w-10 rounded-full bg-gray-50 hover:bg-primary-100 text-gray-400 hover:text-primary-600 flex items-center justify-center transition-colors">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {DAYS.map((day, dIdx) => (
        <div key={day} className="flex border-b border-gray-50 last:border-0 min-h-[10rem] group/row hover:bg-white/40 transition-colors min-w-max">
          <div className="sticky left-0 w-24 shrink-0 bg-white/80 backdrop-blur border-r border-gray-100 flex items-center justify-center z-20 group-hover/row:bg-white transition-colors">
            <div className="rotate-[-90deg] text-sm font-black text-gray-400 uppercase tracking-[0.2em] group-hover/row:text-primary-500 transition-colors whitespace-nowrap">{day}</div>
          </div>
          {periods.map((period, pIdx) => {
            if (period.isBreak) {
              const letter = BREAK_LETTERS[dIdx] || '';
              return (
                <div key={`${day}-${period.id}`} className="w-20 shrink-0 bg-gray-50 border-r border-gray-100 flex items-center justify-center select-none">
                  <span className="text-6xl font-black text-gray-200/80 font-sans">{letter}</span>
                </div>
              );
            }
            if (pIdx > 0) {
              const prev = findSlot(day, periods[pIdx-1].id);
              if (prev?.type === 'Practical' && (prev.duration || 1) > 1) return null;
            }
            const slot = findSlot(day, period.id);
            const color = getSubjectColorName(schedule.subjects, slot?.subjectId || '');
            const styles = getColorClasses(color);
            return (
              <div key={`${day}-${period.id}`} onClick={() => onCellClick(day, period.id)} className={`p-2 relative border-r border-gray-50 last:border-0 shrink-0 ${slot?.type === 'Practical' && (slot.duration || 1) > 1 ? 'w-80' : 'w-40'}`}>
                <div className={`h-full w-full rounded-[1.5rem] transition-all duration-300 flex flex-col relative overflow-hidden group/cell ${slot ? `${styles.bg} border border-transparent hover:border-${styles.border.split('-')[1]}-300 p-4 justify-between shadow-sm hover:shadow-md hover:-translate-y-1` : 'bg-white border border-gray-100 hover:border-primary-200 justify-center items-center hover:shadow-soft'}`}>
                  {slot ? (
                    <>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.pill}`}>{slot.type === 'Practical' ? 'Lab' : 'Theory'}</span>
                          <span className={`text-[10px] font-bold opacity-60 ${styles.text}`}>{getSub(slot.subjectId)?.code}</span>
                        </div>
                        <h4 className={`text-sm font-bold leading-tight line-clamp-3 ${styles.text}`}>{getSub(slot.subjectId)?.name}</h4>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/5">
                        <User size={12} className={styles.lightText} />
                        <span className={`text-xs font-bold truncate ${styles.lightText}`}>{getFacultyInitials(schedule.faculties, slot.facultyIds)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="opacity-20 group-hover/cell:opacity-100 transition-all text-center">
                      <Plus size={24} className="mx-auto text-primary-400 mb-1" />
                      <span className="text-[10px] font-black text-primary-400 uppercase">Add</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
