import React from 'react';
import { Plus, Coffee } from 'lucide-react';
import { DAYS, Period, Schedule } from '../../types';
import { getSubjectColorName, getSolidColorClasses } from '../../utils';

interface ScheduleGridProps {
  schedule: Schedule;
  periods: Period[];
  onCellClick: (day: string, periodId: number) => void;
  onPeriodClick: (period: Period) => void;
  onAddPeriod: () => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ 
  schedule, periods, onCellClick, onPeriodClick, onAddPeriod 
}) => {
  const findSlot = (day: string, period: number) => 
    schedule.timeSlots.find(s => s.day === day && s.period === period);

  const getSub = (id: string) => schedule.subjects.find(s => s.id === id);

  return (
    <div className="w-full overflow-auto bg-gray-50/50 dark:bg-slate-900/50 p-4 rounded-[3rem] no-scrollbar shadow-inner">
      <div 
        className="grid gap-4 min-w-max"
        style={{
           gridTemplateColumns: `60px repeat(${periods.length}, minmax(130px, 1fr)) 50px`
        }}
      >
        <div className="sticky left-0 top-0 z-30 bg-transparent"></div>
        
        {periods.map(p => (
           <div 
             key={p.id} 
             onClick={() => onPeriodClick(p)}
             className="sticky top-0 z-20 flex flex-col items-center justify-end pb-4 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur-md group cursor-pointer"
           >
              {p.isBreak ? (
                  <div className="flex flex-col items-center opacity-40">
                     <Coffee size={12} className="mb-0.5" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Break</span>
                  </div>
              ) : (
                  <>
                    <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-0.5 group-hover:scale-110 transition-transform">
                        {p.id}{p.id === 1 ? 'ST' : p.id === 2 ? 'ND' : p.id === 3 ? 'RD' : 'TH'}
                    </span>
                    <span className="text-[11px] font-black text-gray-900 dark:text-white font-mono bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-gray-100 dark:border-slate-700 shadow-sm">
                        {p.time.split('-')[0].trim()}
                    </span>
                  </>
              )}
           </div>
        ))}
        
        <div className="sticky top-0 z-20 flex items-end justify-center pb-4 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur-md">
             <button onClick={onAddPeriod} className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-300 hover:text-primary-500 transition-colors shadow-sm"><Plus size={18} /></button>
        </div>

        {DAYS.map((day, dIdx) => (
            <React.Fragment key={day}>
               <div className="sticky left-0 z-10 bg-white dark:bg-slate-800 rounded-full shadow-soft border border-gray-100 dark:border-slate-700/50 flex items-center justify-center h-28 w-14">
                   <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-[0.3em] -rotate-90">{day}</span>
               </div>

               {periods.map((period, pIdx) => {
                   if (period.isBreak) {
                       return (
                           <div key={period.id} className="h-28 rounded-full border-2 border-dashed border-gray-100 dark:border-slate-700/30 flex items-center justify-center">
                               <div className="w-1.5 h-full bg-gray-100/50 dark:bg-slate-800/50 rounded-full" />
                           </div>
                       );
                   }

                   if (pIdx > 0) {
                       const prevP = periods[pIdx - 1];
                       if (!prevP.isBreak) {
                           const prevSlot = findSlot(day, prevP.id);
                           if (prevSlot && prevSlot.type === 'Practical' && (prevSlot.duration || 1) > 1) {
                               return null;
                           }
                       }
                   }

                   const slot = findSlot(day, period.id);
                   const colSpan = slot?.type === 'Practical' ? (slot.duration || 1) : 1;
                   
                   if (!slot) {
                       return (
                           <div 
                               key={period.id} 
                               onClick={() => onCellClick(day, period.id)}
                               className="h-28 rounded-full border-2 border-dashed border-gray-100 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 hover:border-primary-200 dark:hover:border-primary-800 transition-all cursor-pointer flex items-center justify-center group"
                           >
                               <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-gray-200 dark:text-slate-700 group-hover:text-primary-300 shadow-sm transition-all">
                                   <Plus size={20} strokeWidth={3} />
                               </div>
                           </div>
                       );
                   }

                   const colorName = getSubjectColorName(schedule.subjects, slot.subjectId);
                   const styles = getSolidColorClasses(colorName);
                   const sub = getSub(slot.subjectId);

                   return (
                       <div 
                           key={period.id}
                           onClick={() => onCellClick(day, period.id)}
                           className={`
                               h-28 rounded-full p-5 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl
                               ${styles.bg} ${styles.text} border-2 border-transparent hover:border-white/40 dark:hover:border-white/10
                           `}
                           style={{ gridColumn: `span ${colSpan}` }}
                       >
                           <div className="font-black text-xs leading-tight line-clamp-2">
                               {sub?.name || 'Unknown'}
                           </div>

                           <div className="mt-auto pt-2 border-t border-black/5 dark:border-white/5">
                               <div className={`text-[9px] font-black uppercase tracking-wider opacity-60 ${styles.subtext}`}>
                                   {slot.type === 'Practical' ? 'Lab Session' : sub?.code || 'No Code'}
                               </div>
                               <div className={`text-[10px] font-black mt-0.5 flex items-center justify-between`}>
                                   <span>RM {schedule.details.section || 'A'}</span>
                                   <span className="opacity-60">{slot.type === 'Theory' ? 'Lec' : 'Lab'}</span>
                               </div>
                           </div>
                       </div>
                   );
               })}

               <div className="h-28 bg-transparent" />
            </React.Fragment>
        ))}
      </div>
    </div>
  );
};