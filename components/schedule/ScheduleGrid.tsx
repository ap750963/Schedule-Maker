import React from 'react';
import { Plus, Coffee, AlertTriangle } from 'lucide-react';
import { DAYS, Period, Schedule } from '../../types';
import { getSubjectColorName, getSolidColorClasses } from '../../utils';

interface ScheduleGridProps {
  schedule: Schedule;
  periods: Period[];
  onCellClick: (day: string, periodId: number) => void;
  onPeriodClick: (period: Period) => void;
  onAddPeriod: () => void;
  getConflictStatus?: (day: string, periodId: number) => string | null;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ 
  schedule, periods, onCellClick, onPeriodClick, onAddPeriod, getConflictStatus 
}) => {
  const findSlot = (day: string, period: number) => 
    schedule.timeSlots.find(s => s.day === day && s.period === period);

  const getSub = (id: string) => schedule.subjects.find(s => s.id === id);

  return (
    <div className="w-full overflow-auto bg-gray-100/30 dark:bg-slate-900/20 p-2 sm:p-6 rounded-[2.5rem] sm:rounded-[3rem] no-scrollbar border border-gray-200 dark:border-slate-800">
      <div 
        className="grid gap-2 sm:gap-4 min-w-max"
        style={{
           gridTemplateColumns: `minmax(60px, 70px) repeat(${periods.length}, minmax(130px, 1fr)) 60px`
        }}
      >
        <div className="sticky left-0 top-0 z-[45] bg-transparent rounded-xl"></div>
        
        {periods.map(p => (
           <div 
             key={p.id} 
             onClick={() => onPeriodClick(p)}
             className="sticky top-0 z-[40] flex flex-col items-center justify-center pt-2 pb-5 bg-gray-50/90 dark:bg-slate-950/90 backdrop-blur-md group cursor-pointer border-b border-gray-200 dark:border-slate-800"
           >
              {p.isBreak ? (
                  <div className="flex flex-col items-center opacity-30 group-hover:opacity-100 transition-opacity">
                     <Coffee size={14} className="mb-1 text-gray-400 dark:text-slate-400" />
                     <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Break</span>
                  </div>
              ) : (
                  <>
                    <span className="text-sm font-black text-gray-900 dark:text-white font-mono opacity-80 group-hover:scale-110 transition-transform">
                        {p.time.split('-')[0].trim()}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-slate-500">
                         - {p.time.split('-')[1].trim()}
                    </span>
                  </>
              )}
           </div>
        ))}
        
        <div className="sticky top-0 z-[40] flex items-center justify-center pb-3 bg-gray-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
             <button onClick={onAddPeriod} className="p-2 text-gray-300 hover:text-primary-500 hover:scale-125 transition-all"><Plus size={24} strokeWidth={3} /></button>
        </div>


        {DAYS.map((day, dIdx) => {
            const coveredPeriods = new Set<number>();

            return (
              <React.Fragment key={day}>
                <div className="sticky left-0 z-[35] bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-200 dark:border-slate-700/80 flex items-center justify-center h-48 sm:h-52 w-14 sm:w-16">
                    <span className="text-[11px] sm:text-[13px] font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] -rotate-90">{day}</span>
                </div>

                {periods.map((period, pIdx) => {
                    if (period.isBreak) {
                        if (dIdx === 0) {
                            return (
                                <div 
                                    key={period.id} 
                                    style={{ gridRow: `2 / span ${DAYS.length}`, gridColumn: pIdx + 2 }}
                                    className="rounded-[3rem] bg-gray-100/50 dark:bg-slate-800/20 border-2 border-dashed border-gray-200 dark:border-slate-700/50 flex flex-col items-center justify-center opacity-40 group hover:opacity-100 transition-opacity cursor-pointer" 
                                    onClick={() => onPeriodClick(period)}
                                >
                                    <div className="flex flex-col items-center justify-center leading-none py-10">
                                        {"RECESS".split("").map((letter, i) => (
                                            <span key={i} className="text-2xl sm:text-4xl font-black text-gray-400 dark:text-slate-400/80 my-2 drop-shadow-sm">{letter}</span>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }

                    if (coveredPeriods.has(period.id)) return null;

                    const slot = findSlot(day, period.id);
                    let colSpan = 1;
                    
                    if (slot && slot.type === 'Practical' && (slot.duration || 1) > 1) {
                         const duration = slot.duration || 1;
                         let academicCount = 1;
                         
                         for (let i = pIdx + 1; i < periods.length; i++) {
                             colSpan++;
                             const p = periods[i];
                             if (!p.isBreak) {
                                 academicCount++;
                                 coveredPeriods.add(p.id);
                             }
                             if (academicCount >= duration) break;
                         }
                    }

                    const conflict = getConflictStatus ? getConflictStatus(day, period.id) : null;
                    
                    if (!slot) {
                        return (
                            <div 
                                key={period.id} 
                                onClick={() => onCellClick(day, period.id)}
                                className="h-48 sm:h-52 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 hover:border-primary-200 dark:hover:border-primary-500 transition-all cursor-pointer flex items-center justify-center group"
                            >
                                <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-200 dark:text-slate-700 group-hover:text-primary-400 group-hover:scale-110 transition-all duration-300">
                                   <Plus size={28} strokeWidth={3} />
                                </div>
                            </div>
                        );
                    }

                    const colorName = getSubjectColorName(schedule.subjects, slot.subjectId, slot.facultyIds);
                    const styles = getSolidColorClasses(colorName);
                    const sub = getSub(slot.subjectId);

                    return (
                        <div 
                            key={period.id}
                            onClick={() => onCellClick(day, period.id)}
                            className={`
                                h-48 sm:h-52 rounded-[3rem] p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden group border-2 ${styles.border}
                                ${styles.bg} ${styles.text}
                                ${conflict ? 'ring-4 ring-rose-500 ring-offset-4 z-10 scale-[0.98]' : ''}
                            `}
                            style={{ gridColumn: `span ${colSpan}` }}
                        >
                            {conflict && (
                               <div className="absolute top-4 right-4 h-10 w-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl animate-pulse z-10">
                                 <AlertTriangle size={20} strokeWidth={2.5} />
                               </div>
                            )}

                            <div className="space-y-1.5">
                                <div className="font-black text-[20px] sm:text-[24px] leading-tight line-clamp-2 tracking-tight">
                                    {sub?.name || 'Unknown'}
                                </div>
                                <div className={`${styles.subtext}`}>
                                    {schedule.details.section ? `Room ${schedule.details.section}` : 'General Hall'}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className={`${styles.accentText} truncate max-w-[180px]`}>
                                    {slot.facultyIds.map(fid => schedule.faculties.find(f => f.id === fid)?.initials).join(', ')}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="h-48 sm:h-52 bg-transparent" />
              </React.Fragment>
            );
        })}
      </div>
    </div>
  );
};