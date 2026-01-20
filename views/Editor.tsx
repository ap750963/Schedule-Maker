
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Download, FileSpreadsheet } from 'lucide-react';
import { Schedule, Period, TimeSlot, FIRST_YEAR_PERIODS, HIGHER_YEAR_PERIODS } from '../types';
import { Button } from '../components/ui/Button';
import { generateId, checkGlobalFacultyConflict, to12Hour } from '../utils';
import { exportToPDF } from '../utils/pdf';
import { exportScheduleToExcel } from '../utils/excel';
import { FacultyTable } from '../components/schedule/FacultyTable';
import { PeriodModal } from '../components/schedule/PeriodModal';
import { ClassModal } from '../components/schedule/ClassModal';
import { ScheduleGrid } from '../components/schedule/ScheduleGrid';

interface EditorProps {
  schedule: Schedule;
  allSchedules: Schedule[];
  onSave: (schedule: Schedule) => void;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ schedule, allSchedules, onSave, onBack }) => {
  const [currentSchedule, setCurrentSchedule] = useState<Schedule>(schedule);
  const [editingSlot, setEditingSlot] = useState<{ day: string, period: number } | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const periods = useMemo(() => {
    if (currentSchedule.periods && currentSchedule.periods.length > 0) {
      return currentSchedule.periods;
    }
    return currentSchedule.details.level === '1st-year' ? FIRST_YEAR_PERIODS : HIGHER_YEAR_PERIODS;
  }, [currentSchedule.periods, currentSchedule.details.level]);

  const facultyStats = useMemo(() => {
    return currentSchedule.faculties.map(fac => {
        const total = currentSchedule.timeSlots
            .filter(slot => slot.facultyIds.includes(fac.id))
            .reduce((acc, slot) => acc + (slot.duration || 1), 0);
        return { ...fac, totalDuration: total };
    });
  }, [currentSchedule.timeSlots, currentSchedule.faculties]);

  const handleSaveSlot = (data: Partial<TimeSlot>) => {
    if (!data.subjectId || !data.facultyIds?.length) return;
    let newSlots = currentSchedule.timeSlots.filter(s => !(s.day === editingSlot?.day && s.period === editingSlot?.period));
    newSlots.push({ ...data as TimeSlot, id: data.id || generateId() });
    const updated = { ...currentSchedule, timeSlots: newSlots, lastModified: Date.now() };
    setCurrentSchedule(updated);
    onSave(updated);
    setEditingSlot(null);
  };

  const editingData = editingSlot ? (currentSchedule.timeSlots.find(s => s.day === editingSlot.day && s.period === editingSlot.period) || { day: editingSlot.day, period: editingSlot.period, type: 'Theory', subjectId: '', facultyIds: [], duration: 1 }) : null;

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
      <div className="absolute -top-20 -right-20 w-[40rem] h-[40rem] bg-primary-200/40 dark:bg-primary-900/20 rounded-full blur-[100px] opacity-60 pointer-events-none animate-pulse" />
      <div className="absolute top-40 -left-20 w-[30rem] h-[30rem] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[80px] opacity-60 pointer-events-none" />
      
      <div className="px-6 py-6 z-20 flex items-center justify-between shrink-0 flex-wrap gap-4 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm border-b border-white/20 dark:border-slate-800/50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-12 w-12 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full shadow-soft flex items-center justify-center text-gray-500 dark:text-slate-300 hover:text-primary-600 hover:scale-110 transition-all border border-white/50 dark:border-slate-700/50">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{currentSchedule.details.className}</h2>
            <div className="mt-1 flex items-center gap-2">
                <span className="bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest border border-white/20 dark:border-slate-700/50">Sec {currentSchedule.details.section}</span>
                <span className="bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest border border-white/20 dark:border-slate-700/50">{currentSchedule.details.semester} Sem</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
             <Button onClick={() => exportScheduleToExcel(currentSchedule)} variant="secondary" icon={<FileSpreadsheet size={18} />} size="sm" className="rounded-2xl border-white/50 bg-white/50 backdrop-blur-sm hover:bg-white/80"><span className="hidden xs:inline">Excel</span></Button>
             <Button onClick={async () => { setIsExporting(true); await exportToPDF('schedule-grid', `${currentSchedule.details.className}.pdf`); setIsExporting(false); }} variant="secondary" icon={<Download size={18} />} disabled={isExporting} size="sm" className="rounded-2xl border-white/50 bg-white/50 backdrop-blur-sm hover:bg-white/80"><span>{isExporting ? '...' : 'PDF'}</span></Button>
            <Button size="sm" onClick={() => onSave(currentSchedule)} className="shadow-glow rounded-2xl px-6">Save</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-8 relative z-10 scroll-smooth">
        <div id="schedule-grid" className="w-full">
            <ScheduleGrid 
                schedule={currentSchedule} 
                periods={periods} 
                onCellClick={(day, periodId) => setEditingSlot({day, period: periodId})}
                onPeriodClick={setEditingPeriod}
                onAddPeriod={() => setEditingPeriod({ id: 0, label: 'New Hour', time: '09:00 AM - 10:00 AM' })}
                getConflictStatus={(day, periodId) => {
                  const slot = currentSchedule.timeSlots.find(ts => ts.day === day && ts.period === periodId);
                  if (!slot) return null;
                  
                  for (const fid of slot.facultyIds) {
                    const conflict = checkGlobalFacultyConflict(fid, day, slot, periods, currentSchedule.id, allSchedules);
                    if (conflict) return `${conflict.scheduleName} (Sem ${conflict.semester})`;
                  }
                  return null;
                }}
            />
        </div>
        <FacultyTable stats={facultyStats} />
        <div className="h-20" />
      </div>

      {editingSlot && editingData && (
        <ClassModal 
          data={editingData}
          schedule={currentSchedule}
          allSchedules={allSchedules}
          day={editingSlot.day}
          periodLabel={periods.find(p => p.id === editingSlot.period)?.label}
          onClose={() => setEditingSlot(null)}
          onSave={handleSaveSlot}
          onDelete={() => { setCurrentSchedule({...currentSchedule, timeSlots: currentSchedule.timeSlots.filter(s => !(s.day === editingSlot.day && s.period === editingSlot.period))}); setEditingSlot(null); }}
          onCheckConflict={(fid, currentSlotData) => {
             const conflict = checkGlobalFacultyConflict(fid, editingSlot.day, currentSlotData, periods, currentSchedule.id, allSchedules);
             return conflict ? `${conflict.scheduleName} | ${conflict.semester} Sem` : null;
          }}
        />
      )}

      {editingPeriod && (
        <PeriodModal 
          period={editingPeriod} 
          onSave={(p, s, e) => {
            const time = `${to12Hour(s)} - ${to12Hour(e)}`;
            let list = [...periods];
            if (p.id === 0) list.push({...p, id: Math.max(0, ...list.map(x=>x.id))+1, time});
            else list = list.map(x => x.id === p.id ? {...p, time} : x);
            setCurrentSchedule({...currentSchedule, periods: list});
            setEditingPeriod(null);
          }}
          onDelete={(id) => { setCurrentSchedule({...currentSchedule, periods: periods.filter(x => x.id !== id)}); setEditingPeriod(null); }}
          onClose={() => setEditingPeriod(null)}
        />
      )}
    </div>
  );
};
