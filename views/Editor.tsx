import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Save, Plus, User, Coffee, Edit2, Download } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, DEFAULT_PERIODS, SUBJECT_COLORS } from '../types';
import { Button } from '../components/ui/Button';
import { generateId, getColorClasses, getSubjectColorName, getFacultyInitials } from '../utils';
import { exportToPDF } from '../utils/pdf';
import { FacultyTable } from '../components/schedule/FacultyTable';
import { PeriodModal } from '../components/schedule/PeriodModal';
import { ClassModal } from '../components/schedule/ClassModal';

interface EditorProps {
  schedule: Schedule;
  onSave: (schedule: Schedule) => void;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ schedule, onSave, onBack }) => {
  const [currentSchedule, setCurrentSchedule] = useState<Schedule>(schedule);
  const [editingSlot, setEditingSlot] = useState<{ day: string, period: number } | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [tempSlotData, setTempSlotData] = useState<Partial<TimeSlot>>({});
  const [isExporting, setIsExporting] = useState(false);

  const periods = currentSchedule.periods || DEFAULT_PERIODS;

  const findSlot = (day: string, period: number) => {
    return currentSchedule.timeSlots.find(s => s.day === day && s.period === period);
  };

  const getSubjectCode = (id: string) => currentSchedule.subjects.find(s => s.id === id)?.code || '';
  const getSubjectName = (id: string) => currentSchedule.subjects.find(s => s.id === id)?.name || 'Free';

  // Calculate Faculty Hours
  const facultyStats = useMemo(() => {
    return currentSchedule.faculties.map(fac => {
        const totalDuration = currentSchedule.timeSlots
            .filter(slot => slot.facultyIds.includes(fac.id))
            .reduce((acc, slot) => acc + (slot.duration || 1), 0);
        return { ...fac, totalDuration };
    });
  }, [currentSchedule.timeSlots, currentSchedule.faculties]);

  const handleCellClick = (day: string, period: number) => {
    const pIndex = periods.findIndex(p => p.id === period);
    const targetPeriod = periods[pIndex];

    if (targetPeriod.isBreak) return;

    if (pIndex > 0) {
        const prevPeriodId = periods[pIndex - 1].id;
        const prevSlot = findSlot(day, prevPeriodId);
        if (prevSlot && prevSlot.type === 'Practical' && (prevSlot.duration || 1) > 1) {
            handleCellClick(day, prevPeriodId);
            return;
        }
    }

    const existing = findSlot(day, period);
    const periodData = periods.find(p => p.id === period);
    
    setTempSlotData(existing || { 
        day, 
        period: period,
        startTime: periodData?.time || '',
        type: 'Theory',
        subjectId: '',
        facultyIds: [],
        duration: 1
    });
    setEditingSlot({ day, period });
  };

  const handleSaveSlot = (data: Partial<TimeSlot>) => {
    if (!data.subjectId || !data.facultyIds || data.facultyIds.length === 0) return;

    let newSlots = currentSchedule.timeSlots.filter(
        s => !(s.day === editingSlot?.day && s.period === editingSlot?.period)
    );

    const duration = data.duration || 1;

    if (data.type === 'Practical' && duration > 1) {
         const periodIndex = periods.findIndex(p => p.id === editingSlot?.period);
         if (periodIndex >= periods.length - 1) {
             alert("Cannot schedule a multi-hour class in the last hour.");
             return;
         }
         const nextPeriod = periods[periodIndex + 1];
         if (nextPeriod.isBreak) {
            alert("Cannot schedule a class that spans across a Break.");
            return;
         }
         const nextPeriodId = nextPeriod.id;
         newSlots = newSlots.filter(
            s => !(s.day === editingSlot?.day && s.period === nextPeriodId)
        );
    }

    newSlots.push({
        ...data as TimeSlot,
        id: data.id || generateId(),
        duration: duration
    });

    const updated = {
        ...currentSchedule,
        timeSlots: newSlots,
        lastModified: Date.now()
    };

    setCurrentSchedule(updated);
    onSave(updated);
    setEditingSlot(null);
  };

  const handleDeleteSlot = () => {
     const newSlots = currentSchedule.timeSlots.filter(
        s => !(s.day === editingSlot?.day && s.period === editingSlot?.period)
    );
    const updated = {
        ...currentSchedule,
        timeSlots: newSlots,
        lastModified: Date.now()
    };
    setCurrentSchedule(updated);
    onSave(updated);
    setEditingSlot(null);
  };

  // Period Management
  const handleSavePeriod = (updatedPeriod: Period, start: string, end: string) => {
      let newPeriods = [...periods];
      const timeString = `${start} - ${end}`;
      
      if (updatedPeriod.id === 0) { // New
          const maxId = Math.max(0, ...newPeriods.map(p => p.id));
          newPeriods.push({ ...updatedPeriod, id: maxId + 1, time: timeString });
      } else { // Edit
          newPeriods = newPeriods.map(p => p.id === updatedPeriod.id ? { ...updatedPeriod, time: timeString } : p);
      }
      
      const updated = { ...currentSchedule, periods: newPeriods, lastModified: Date.now() };
      setCurrentSchedule(updated);
      onSave(updated);
      setEditingPeriod(null);
  };

  const handleDeletePeriod = (id: number) => {
      const newPeriods = periods.filter(p => p.id !== id);
      const newSlots = currentSchedule.timeSlots.filter(s => s.period !== id);
      const updated = { ...currentSchedule, periods: newPeriods, timeSlots: newSlots, lastModified: Date.now() };
      setCurrentSchedule(updated);
      onSave(updated);
      setEditingPeriod(null);
  };

  const handleExport = async () => {
      setIsExporting(true);
      await exportToPDF('schedule-grid', `${currentSchedule.details.className || 'Schedule'}.pdf`);
      setIsExporting(false);
  };

  const BREAK_LETTERS = ['B', 'R', 'E', 'A', 'K'];

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden">
      
      {/* Background */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40 animate-float pointer-events-none" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-40 animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <div className="px-6 py-6 z-20 flex items-center justify-between shrink-0 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="h-12 w-12 bg-white rounded-full shadow-soft flex items-center justify-center text-gray-500 hover:text-primary-600 hover:scale-110 transition-all border border-white/50"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-gray-900 leading-none tracking-tight">{currentSchedule.details.className}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="bg-white/50 px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-white/50">
                    Sec {currentSchedule.details.section} • {currentSchedule.details.semester} Sem
                </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
             <Button 
                onClick={handleExport} 
                variant="secondary" 
                icon={<Download size={18} />} 
                disabled={isExporting}
                size="sm"
                className="rounded-2xl"
             >
                <span className="hidden xs:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
                <span className="xs:hidden">{isExporting ? '...' : 'PDF'}</span>
             </Button>
            <Button size="sm" onClick={() => onSave(currentSchedule)} icon={<Save size={18} strokeWidth={2.5}/>} className="shadow-glow rounded-2xl">
                Save
            </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative z-10 px-4 pb-4 flex flex-col gap-4">
        
        {/* Grid Container */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-card border border-white overflow-auto relative scroll-smooth flex-shrink-0" style={{ maxHeight: '65vh' }}>
            <div id="schedule-grid" className="min-w-fit h-full flex flex-col p-4 bg-white/60"> 
                
                {/* Sticky Header Row (Hours/Periods) */}
                <div className="sticky top-0 z-30 flex border-b border-gray-100 bg-white/95 backdrop-blur-xl shadow-sm min-w-max rounded-t-2xl">
                    <div className="w-24 shrink-0 border-r border-gray-100 bg-white/50 flex items-center justify-center py-4">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Day</span>
                    </div>
                    {periods.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => setEditingPeriod(p)}
                            className={`
                                shrink-0 py-4 px-2 text-center group cursor-pointer border-r border-gray-50 hover:bg-gray-50/80 transition-colors relative
                                ${p.isBreak ? 'w-20 bg-gray-50' : 'w-40'}
                            `}
                        >
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
                         <button 
                            onClick={() => setEditingPeriod({ id: 0, label: `Hour ${periods.length + 1}`, time: '09:00 - 10:00' })}
                            className="h-10 w-10 rounded-full bg-gray-50 hover:bg-primary-100 text-gray-400 hover:text-primary-600 flex items-center justify-center transition-colors"
                        >
                            <Plus size={20} />
                         </button>
                    </div>
                </div>

                {/* Day Rows */}
                {DAYS.map((day, dayIndex) => (
                    <div key={day} className="flex border-b border-gray-50 last:border-0 min-h-[10rem] group/row hover:bg-white/40 transition-colors min-w-max">
                        <div className="sticky left-0 w-24 shrink-0 bg-white/80 backdrop-blur border-r border-gray-100 flex items-center justify-center z-20 group-hover/row:bg-white transition-colors">
                             <div className="rotate-[-90deg] text-sm font-black text-gray-400 uppercase tracking-[0.2em] group-hover/row:text-primary-500 transition-colors whitespace-nowrap">
                                {day}
                             </div>
                        </div>

                        {periods.map((period, index) => {
                            if (period.isBreak) {
                                const letter = BREAK_LETTERS[dayIndex] || null;
                                return (
                                    <div key={`${day}-${period.id}`} className="w-20 shrink-0 bg-gray-50 border-r border-gray-100 flex items-center justify-center select-none">
                                        {letter ? (
                                            <span className="text-6xl font-black text-gray-200/80 font-sans">{letter}</span>
                                        ) : (
                                            <Coffee size={32} className="text-gray-200" />
                                        )}
                                    </div>
                                );
                            }

                            if (index > 0) {
                                const prevPeriodId = periods[index - 1].id;
                                const prev = findSlot(day, prevPeriodId);
                                if (prev && prev.type === 'Practical' && (prev.duration || 1) > 1) {
                                    return null; 
                                }
                            }

                            const slot = findSlot(day, period.id);
                            const isTheory = slot?.type === 'Theory';
                            const isPractical = slot?.type === 'Practical';
                            const duration = slot?.duration || 1;
                            
                            let colorClasses = { bg: 'bg-transparent', border: 'border-gray-100', text: 'text-gray-900', lightText: 'text-gray-500', pill: 'bg-gray-100 text-gray-700' };
                            if (slot) {
                                const colorName = getSubjectColorName(currentSchedule.subjects, slot.subjectId);
                                colorClasses = getColorClasses(colorName);
                            }

                            return (
                                <div 
                                    key={`${day}-${period.id}`} 
                                    onClick={() => handleCellClick(day, period.id)}
                                    className={`
                                        p-2 relative border-r border-gray-50 last:border-0 shrink-0
                                        ${isPractical && duration > 1 ? 'w-80' : 'w-40'} 
                                    `}
                                >
                                    <div className={`
                                        h-full w-full rounded-[1.5rem] transition-all duration-300 flex flex-col relative overflow-hidden group/cell
                                        ${slot 
                                            ? `${colorClasses.bg} border border-transparent hover:border-${colorClasses.border.split('-')[1]}-300 p-4 justify-between shadow-sm hover:shadow-md hover:-translate-y-1` 
                                            : 'bg-white border border-gray-100 hover:border-primary-200 justify-center items-center hover:shadow-soft'
                                        }
                                    `}>
                                        {slot ? (
                                            <>
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${colorClasses.pill}`}>
                                                            {isTheory ? 'Theory' : 'Lab'}
                                                            {isPractical && duration > 1 && <span className="ml-1 opacity-75">({duration}h)</span>}
                                                        </span>
                                                        <span className={`text-[10px] font-bold opacity-60 ${colorClasses.text}`}>
                                                            {getSubjectCode(slot.subjectId)}
                                                        </span>
                                                    </div>
                                                    <h4 className={`text-sm font-bold leading-tight line-clamp-3 ${colorClasses.text}`}>
                                                        {getSubjectName(slot.subjectId)}
                                                    </h4>
                                                </div>

                                                <div className={`relative z-10 flex items-center gap-2 mt-2 pt-2 border-t border-black/5`}>
                                                    <div className={`p-1 rounded-full bg-white/50 ${colorClasses.lightText}`}>
                                                        <User size={12} strokeWidth={3} />
                                                    </div>
                                                    <span className={`text-xs font-bold truncate ${colorClasses.lightText}`}>
                                                        {getFacultyInitials(currentSchedule.faculties, slot.facultyIds)}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full w-full flex flex-col items-center justify-center transition-all duration-300 opacity-20 group-hover/cell:opacity-100">
                                                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-2 shadow-sm">
                                                    <Plus size={20} strokeWidth={3} />
                                                </div>
                                                <span className="text-xs font-bold text-primary-400">Add Class</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="w-20 shrink-0"></div>
                    </div>
                ))}
            </div>
        </div>

        {/* Faculty Hours Table */}
        <FacultyTable stats={facultyStats} />
      </div>

      {editingSlot && (
        <ClassModal 
            data={tempSlotData}
            schedule={currentSchedule}
            day={editingSlot.day}
            periodLabel={periods.find(p => p.id === editingSlot.period)?.label}
            onClose={() => setEditingSlot(null)}
            onSave={handleSaveSlot}
            onDelete={handleDeleteSlot}
        />
      )}

      {editingPeriod && (
        <PeriodModal
            period={editingPeriod}
            onSave={handleSavePeriod}
            onDelete={handleDeletePeriod}
            onClose={() => setEditingPeriod(null)}
        />
      )}
    </div>
  );
};