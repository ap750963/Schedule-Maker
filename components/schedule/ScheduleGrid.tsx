import React from 'react';
import { Plus, Coffee, AlertCircle } from 'lucide-react';
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
    <div className="w-full overflow-auto bg-gray-50/50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[3rem] scrollbar-hide">
      <div 
        className="grid gap-4 min-w-max"
        style={{
           // First col: Day (80px), Others: Periods (min 160px), Last: Add Button (60px)
           gridTemplateColumns: `80px repeat(${periods.length}, minmax(160px, 1fr)) 60px`
        }}
      >
        {/* === HEADER ROW === */}
        {/* Corner Spacer */}
        <div className="sticky left-0 top-0 z-30 bg-gray-50/0 backdrop-blur-sm rounded-xl"></div>
        
        {/* Period Headers */}
        {periods.map(p => (
           <div 
             key={p.id} 
             onClick={() => onPeriodClick(p)}
             className="sticky top-0 z-20 flex flex-col items-center justify-end pb-4 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur-sm group cursor-pointer"
           >
              {p.isBreak ? (
                  <div className="flex flex-col items-center opacity-50">
                     <Coffee size={14} className="mb-1" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Break</span>
                  </div>
              ) : (
                  <>
                    <span className="text-[10px] font-black text-blue-400 dark:text-blue-300 uppercase tracking-widest mb-1 group-hover:text-blue-600 transition-colors">
                        {/* Ordinal numbers logic or just ID if simple */}
                        {p.id}{p.id === 1 ? 'ST' : p.id === 2 ? 'ND' : p.id === 3 ? 'RD' : 'TH'}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                        {p.time.split('-')[0].trim()}
                    </span>
                  </>
              )}
           </div>
        ))}
        
        {/* Add Period Header */}
        <div className="sticky top-0 z-20 flex items-end justify-center pb-4 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur-sm">
             <button onClick={onAddPeriod} className="p-2 text-gray-300 hover:text-primary-500 transition-colors"><Plus size={20} /></button>
        </div>


        {/* === DATA ROWS === */}
        {DAYS.map((day, dIdx) => (
            <React.Fragment key={day}>
               {/* Day Label Column */}
               <div className="sticky left-0 z-10 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center h-40 w-20">
                   <span className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-[0.2em] -rotate-90">{day}</span>
               </div>

               {/* Slots */}
               {periods.map((period, pIdx) => {
                   if (period.isBreak) {
                       return (
                           <div key={period.id} className="h-40 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-slate-700/50 flex flex-col items-center justify-center opacity-50">
                               <div className="w-1 h-full bg-gray-100 dark:bg-slate-700 rounded-full" />
                           </div>
                       );
                   }

                   // Check previous span
                   if (pIdx > 0) {
                       const prevP = periods[pIdx - 1];
                       if (!prevP.isBreak) {
                           const prevSlot = findSlot(day, prevP.id);
                           if (prevSlot && prevSlot.type === 'Practical' && (prevSlot.duration || 1) > 1) {
                               return null; // Consumed by span
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
                               className="h-40 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer flex items-center justify-center group"
                           >
                               <Plus size={24} className="text-gray-200 dark:text-slate-700 group-hover:text-blue-300 transition-colors" />
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
                               h-40 rounded-[2rem] p-5 flex flex-col justify-between cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg
                               ${styles.bg} ${styles.text}
                           `}
                           style={{ gridColumn: `span ${colSpan}` }}
                       >
                           {/* Header: Subject Name */}
                           <div className="font-bold text-lg leading-tight line-clamp-2">
                               {sub?.name || 'Unknown'}
                           </div>

                           {/* Footer: Details */}
                           <div className="mt-auto space-y-1">
                               <div className={`text-xs font-bold uppercase tracking-wide opacity-80 ${styles.subtext}`}>
                                   {slot.type === 'Practical' ? 'Lab Session' : sub?.code || 'No Code'}
                               </div>
                               <div className={`text-sm font-black ${styles.text} flex items-center justify-between`}>
                                   <span>{schedule.details.section ? `RM ${schedule.details.section}` : 'RM --'}</span>
                                   {/* Placeholder for Room or Faculty Initials */}
                               </div>
                           </div>
                       </div>
                   );
               })}

               {/* Filler for Add Button Column */}
               <div className="h-40 bg-transparent" />
            </React.Fragment>
        ))}
      </div>
    </div>
  );
};