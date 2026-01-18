
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Download } from 'lucide-react';
import { Schedule, DEFAULT_PERIODS, Period, TimeSlot } from '../types';
import { Button } from '../components/ui/Button';
import { generateId } from '../utils';
import { exportToPDF } from '../utils/pdf';
import { FacultyTable } from '../components/schedule/FacultyTable';
import { PeriodModal } from '../components/schedule/PeriodModal';
import { ClassModal } from '../components/schedule/ClassModal';
import { ScheduleGrid } from '../components/schedule/ScheduleGrid';

interface EditorProps {
  schedule: Schedule;
  onSave: (schedule: Schedule) => void;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ schedule, onSave, onBack }) => {
  const [currentSchedule, setCurrentSchedule] = useState<Schedule>(schedule);
  const [editingSlot, setEditingSlot] = useState<{ day: string, period: number } | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const periods = currentSchedule.periods || DEFAULT_PERIODS;

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
    const duration = data.duration || 1;
    if (data.type === 'Practical' && duration > 1) {
         const pIdx = periods.findIndex(p => p.id === editingSlot?.period);
         if (pIdx < periods.length - 1 && !periods[pIdx+1].isBreak) {
            newSlots = newSlots.filter(s => !(s.day === editingSlot?.day && s.period === periods[pIdx+1].id));
         }
    }
    newSlots.push({ ...data as TimeSlot, id: data.id || generateId(), duration });
    const updated = { ...currentSchedule, timeSlots: newSlots, lastModified: Date.now() };
    setCurrentSchedule(updated);
    onSave(updated);
    setEditingSlot(null);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden">
      <div className="px-6 py-6 z-20 flex items-center justify-between shrink-0 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-12 w-12 bg-white rounded-full shadow-soft flex items-center justify-center text-gray-500 hover:text-primary-600 border border-white/50"><ArrowLeft size={22} /></button>
          <div><h2 className="text-2xl font-black text-gray-900 leading-none">{currentSchedule.details.className}</h2><div className="mt-1"><span className="bg-white/50 px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-500 uppercase">Sec {currentSchedule.details.section} • {currentSchedule.details.semester} Sem</span></div></div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
             <Button onClick={async () => { setIsExporting(true); await exportToPDF('schedule-grid', `${currentSchedule.details.className}.pdf`); setIsExporting(false); }} variant="secondary" icon={<Download size={18} />} disabled={isExporting} size="sm" className="rounded-2xl"><span>{isExporting ? '...' : 'Export PDF'}</span></Button>
            <Button size="sm" onClick={() => onSave(currentSchedule)} className="shadow-glow rounded-2xl">Save</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-8">
        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-card border border-white overflow-x-auto min-h-[500px]">
          <ScheduleGrid 
            schedule={currentSchedule} 
            periods={periods} 
            onCellClick={(day, periodId) => setEditingSlot({day, period: periodId})}
            onPeriodClick={setEditingPeriod}
            onAddPeriod={() => setEditingPeriod({ id: 0, label: 'New Hour', time: '09:00 - 10:00' })}
          />
        </div>
        <FacultyTable stats={facultyStats} />
      </div>

      {editingSlot && (
        <ClassModal 
          data={currentSchedule.timeSlots.find(s => s.day === editingSlot.day && s.period === editingSlot.period) || { day: editingSlot.day, period: editingSlot.period, type: 'Theory', subjectId: '', facultyIds: [], duration: 1 }}
          schedule={currentSchedule}
          day={editingSlot.day}
          periodLabel={periods.find(p => p.id === editingSlot.period)?.label}
          onClose={() => setEditingSlot(null)}
          onSave={handleSaveSlot}
          onDelete={() => { setCurrentSchedule({...currentSchedule, timeSlots: currentSchedule.timeSlots.filter(s => !(s.day === editingSlot.day && s.period === editingSlot.period))}); setEditingSlot(null); }}
        />
      )}

      {editingPeriod && (
        <PeriodModal 
          period={editingPeriod} 
          onSave={(p, s, e) => {
            const time = `${s} - ${e}`;
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
