import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, User, Plus, Edit2, Coffee, Download, AlertTriangle, UserX } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, Faculty } from '../types';
import { Button } from '../components/ui/Button';
import { generateId, getColorClasses, getSubjectColorName, getFacultyInitials } from '../utils';
import { exportToPDF } from '../utils/pdf';
import { PeriodModal } from '../components/schedule/PeriodModal';
import { ClassModal } from '../components/schedule/ClassModal';

interface MultiSemesterEditorProps {
  schedules: Schedule[];
  onSaveAll: (schedules: Schedule[]) => void;
  onBack: () => void;
}

const RECESS_LETTERS = ['R', 'E', 'C', 'E', 'S', 'S'];
const EXTERNAL_BUSY_ID = 'external-busy';

export const MultiSemesterEditor: React.FC<MultiSemesterEditorProps> = ({ schedules, onSaveAll, onBack }) => {
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(JSON.parse(JSON.stringify(schedules)));
  const [isExporting, setIsExporting] = useState(false);
  
  // Separate academic schedules from the external busy container
  const { academicSchedules, externalSchedule } = useMemo(() => {
    const academic = localSchedules.filter(s => s.id !== EXTERNAL_BUSY_ID).sort((a, b) => {
        const semA = parseInt(a.details.semester) || 0;
        const semB = parseInt(b.details.semester) || 0;
        return semA - semB;
    });
    const external = localSchedules.find(s => s.id === EXTERNAL_BUSY_ID);
    return { academicSchedules: academic, externalSchedule: external };
  }, [localSchedules]);

  // Merge faculties from all academic schedules to use in the external row
  const allFaculties = useMemo(() => {
    const map = new Map<string, Faculty>();
    localSchedules.forEach(s => {
        if (s.id !== EXTERNAL_BUSY_ID) {
            s.faculties.forEach(f => {
                if (!map.has(f.id)) map.set(f.id, f);
            });
        }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [localSchedules]);

  const masterPeriods = academicSchedules[0]?.periods || [];

  const [editingCell, setEditingCell] = useState<{
    scheduleId: string;
    day: string;
    periodId: number;
  } | null>(null);

  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [tempSlot, setTempSlot] = useState<Partial<TimeSlot>>({});

  const findSlot = (schedule: Schedule | undefined, day: string, periodId: number) => {
    if (!schedule) return undefined;
    return schedule.timeSlots.find(s => s.day === day && s.period === periodId);
  };

  const checkConflict = (scheduleId: string, day: string, periodId: number, facultyId: string) => {
    for (const s of localSchedules) {
        if (s.id === scheduleId) continue;
        
        // Find ALL slots in this schedule for this time
        const slots = s.timeSlots.filter(ts => ts.day === day && ts.period === periodId);
        
        for (const slot of slots) {
            if (slot.facultyIds.includes(facultyId)) {
                if (s.id === EXTERNAL_BUSY_ID) {
                    return slot.externalDetails?.dept 
                        ? `${slot.externalDetails.dept}` 
                        : "External Dept";
                }
                return s.details.semester + " Sem";
            }
        }
    }
    return null;
  };

  const getConflictsForCell = () => {
      if (!editingCell || !tempSlot.facultyIds) return {};
      const conflicts: Record<string, string> = {};
      tempSlot.facultyIds.forEach(fid => {
          // If we are editing an external slot, we need to check if we conflict with ITSELF if we are not careful,
          // but checkConflict skips 'scheduleId' so it's fine.
          const conf = checkConflict(editingCell.scheduleId, editingCell.day, editingCell.periodId, fid);
          if (conf) conflicts[fid] = conf;
      });
      return conflicts;
  };

  const handleCellClick = (schedule: Schedule, day: string, periodId: number, existingSlot?: TimeSlot) => {
    const period = masterPeriods.find(p => p.id === periodId);
    if (period?.isBreak) return;

    // For standard schedule, there is only one slot. For external, we can have multiple.
    // existingSlot is passed if we clicked a specific bubble in External row.
    // If we clicked the empty cell area in External row, existingSlot is undefined -> Create New.
    
    // For academic schedules, we always try to find the one slot if we didn't pass one explicitly (though usually one per cell)
    const slotToEdit = existingSlot || (schedule.id !== EXTERNAL_BUSY_ID ? findSlot(schedule, day, periodId) : undefined);
    
    setTempSlot(slotToEdit || {
        day,
        period: periodId,
        type: schedule.id === EXTERNAL_BUSY_ID ? 'Busy' : 'Theory',
        subjectId: schedule.id === EXTERNAL_BUSY_ID ? 'external' : '',
        facultyIds: [],
        duration: 1,
        externalDetails: { dept: '', semester: '', subject: '' }
    });
    setEditingCell({ scheduleId: schedule.id, day, periodId });
  };

  const handleSaveSlot = (data: Partial<TimeSlot>) => {
    if (!editingCell) return;
    
    setLocalSchedules(prev => prev.map(sch => {
        if (sch.id !== editingCell.scheduleId) return sch;

        let newSlots = [...sch.timeSlots];
        
        if (sch.id === EXTERNAL_BUSY_ID) {
            // For External Busy, we support multiple slots per cell.
            // If we are editing an existing slot (it has an ID), remove the old version.
            if (data.id) {
                newSlots = newSlots.filter(s => s.id !== data.id);
            }
        } else {
            // For Academic Schedules, enforce one slot per cell.
            // Remove any slot at this position.
            newSlots = newSlots.filter(s => !(s.day === editingCell.day && s.period === editingCell.periodId));
            
            // Handle spanning practical removal
            if (data.type === 'Practical' && (data.duration || 1) > 1) {
                 const pIndex = masterPeriods.findIndex(p => p.id === editingCell.periodId);
                 if (pIndex !== -1 && pIndex < masterPeriods.length - 1) {
                     const nextPeriodId = masterPeriods[pIndex + 1].id;
                     if (!masterPeriods[pIndex+1].isBreak) {
                         newSlots = newSlots.filter(s => !(s.day === editingCell.day && s.period === nextPeriodId));
                     }
                 }
            }
        }

        const isValid = sch.id === EXTERNAL_BUSY_ID 
            ? (data.facultyIds && data.facultyIds.length > 0)
            : (data.subjectId && data.facultyIds?.length);

        if (isValid) {
            newSlots.push({
                ...data as TimeSlot,
                id: data.id || generateId(),
                startTime: masterPeriods.find(p => p.id === editingCell.periodId)?.time || ''
            });
        }

        return { ...sch, timeSlots: newSlots, lastModified: Date.now() };
    }));

    setEditingCell(null);
  };

  const handleDeleteSlot = () => {
    if (!editingCell) return;
    setLocalSchedules(prev => prev.map(sch => {
        if (sch.id !== editingCell.scheduleId) return sch;
        
        let newSlots = [...sch.timeSlots];
        
        if (sch.id === EXTERNAL_BUSY_ID) {
            // Delete specific slot by ID
             if (tempSlot.id) {
                newSlots = newSlots.filter(s => s.id !== tempSlot.id);
            }
        } else {
            // Delete by position
            newSlots = newSlots.filter(s => !(s.day === editingCell.day && s.period === editingCell.periodId));
        }
        
        return { ...sch, timeSlots: newSlots, lastModified: Date.now() };
    }));
    setEditingCell(null);
  };

  const handleSavePeriod = (updatedPeriod: Period, start: string, end: string) => {
      const timeString = `${start} - ${end}`;
      let newPeriods = [...masterPeriods];
      
      if (updatedPeriod.id === 0) { 
          const maxId = Math.max(0, ...newPeriods.map(p => p.id));
          newPeriods.push({ ...updatedPeriod, id: maxId + 1, time: timeString });
      } else { 
          newPeriods = newPeriods.map(p => p.id === updatedPeriod.id ? { ...updatedPeriod, time: timeString } : p);
      }
      
      setLocalSchedules(prev => prev.map(s => ({
          ...s,
          periods: newPeriods,
          timeSlots: updatedPeriod.isBreak 
            ? s.timeSlots.filter(ts => ts.period !== updatedPeriod.id)
            : s.timeSlots
      })));
      setEditingPeriod(null);
  };

  const handleDeletePeriod = (id: number) => {
      const newPeriods = masterPeriods.filter(p => p.id !== id);
      setLocalSchedules(prev => prev.map(s => ({
          ...s,
          periods: newPeriods,
          timeSlots: s.timeSlots.filter(ts => ts.period !== id)
      })));
      setEditingPeriod(null);
  };

  const handleAddPeriod = () => {
     setEditingPeriod({
         id: 0,
         label: `Hour ${masterPeriods.length + 1}`,
         time: '09:00 - 10:00',
         isBreak: false
     });
  };

  const handleExport = async () => {
      setIsExporting(true);
      await exportToPDF('master-grid', `${academicSchedules[0]?.details.className || 'Schedule'}_Master.pdf`);
      setIsExporting(false);
  };

  const currentEditingSchedule = localSchedules.find(s => s.id === editingCell?.scheduleId);
  const mergedScheduleForModal = currentEditingSchedule ? {
      ...currentEditingSchedule,
      faculties: allFaculties
  } : null;

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
        {/* Ambient Background Blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-40 pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-6 z-50 flex items-center justify-between shrink-0 flex-wrap gap-4 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm border-b border-white/20 dark:border-slate-800/50">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="h-12 w-12 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full shadow-soft flex items-center justify-center text-gray-500 dark:text-slate-300 hover:text-primary-600 hover:scale-110 transition-all border border-white/50 dark:border-slate-700/50">
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight">Department Master</h2>
                    <p className="text-sm font-bold text-gray-500 dark:text-slate-400 mt-1">
                        {academicSchedules[0]?.details.className} • {academicSchedules[0]?.details.session}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                 <Button 
                    onClick={handleExport} 
                    variant="secondary" 
                    icon={<Download size={18} />} 
                    disabled={isExporting}
                    size="sm"
                    className="rounded-2xl border-white/50 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                 >
                    <span className="hidden xs:inline">{isExporting ? 'Generating...' : 'Export PDF'}</span>
                    <span className="xs:hidden">{isExporting ? '...' : 'PDF'}</span>
                 </Button>
                 <Button onClick={() => onSaveAll(localSchedules)} icon={<Save size={18} />} size="sm" className="shadow-glow rounded-2xl px-6">
                    Save All
                 </Button>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-6 relative z-10 scroll-smooth">
            <div id="master-grid" className="min-w-fit space-y-8">
                <table className="w-full border-separate border-spacing-2">
                    <thead className="sticky top-0 z-40">
                        <tr>
                            <th className="sticky left-0 top-0 z-50 p-0 w-20 align-bottom">
                                <div className="h-14 mb-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border border-white/20 dark:border-slate-700/30 flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Day</span>
                                </div>
                            </th>
                            <th className="sticky left-[5.5rem] top-0 z-50 p-0 w-20 align-bottom">
                                <div className="h-14 mb-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border border-white/20 dark:border-slate-700/30 flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Sem</span>
                                </div>
                            </th>
                            {masterPeriods.map(p => (
                                <th 
                                    key={p.id} 
                                    className="sticky top-0 z-40 p-0 align-bottom group cursor-pointer"
                                    onClick={() => setEditingPeriod(p)}
                                >
                                    <div className={`
                                        mb-2 mx-auto flex flex-col items-center justify-center gap-1 rounded-[1.5rem] border border-white/20 dark:border-slate-700/30 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg relative
                                        ${p.isBreak ? 'bg-gray-50/50 dark:bg-slate-800/50 w-16 min-h-[5rem]' : 'bg-white/40 dark:bg-slate-800/40 w-48 min-h-[5rem] py-2'}
                                    `}>
                                        {p.isBreak ? (
                                            <>
                                                <Coffee size={16} className="text-gray-400 dark:text-slate-500 mb-1" />
                                                <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest rotate-90">Break</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 font-mono tracking-tighter uppercase">{p.label}</div>
                                                <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl px-2 py-1 border border-white/40 dark:border-slate-600/30">
                                                    <span className="text-[10px] font-black text-gray-700 dark:text-slate-200">{p.time}</span>
                                                </div>
                                                <Edit2 size={10} className="absolute top-2 right-2 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="sticky top-0 z-40 p-0 w-16 align-bottom">
                                <div className="h-14 w-14 mb-2 mx-auto">
                                    <button 
                                        onClick={handleAddPeriod}
                                        className="h-full w-full rounded-[1.5rem] bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 text-gray-400 dark:text-slate-500 transition-all shadow-sm hover:shadow-glow hover:scale-110 flex items-center justify-center"
                                        title="Add Time Slot"
                                    >
                                        <Plus size={24} strokeWidth={3} />
                                    </button>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map((day, dayIndex) => (
                            <React.Fragment key={day}>
                                {/* Academic Schedules */}
                                {academicSchedules.map((sch, index) => (
                                    <tr key={`${day}-${sch.id}`} className="group/row">
                                        {index === 0 && (
                                            <td 
                                                rowSpan={academicSchedules.length + (externalSchedule ? 1 : 0)} 
                                                className="sticky left-0 z-30 p-0 align-top"
                                            >
                                                <div className="w-20 h-[calc(100%-0.5rem)] bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-[2rem] flex items-center justify-center shadow-card mt-0 mr-2 group-hover/row:scale-[1.02] transition-transform">
                                                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-lg font-black text-gray-300 dark:text-slate-600 uppercase tracking-[0.3em] group-hover/row:text-primary-500 transition-colors">
                                                        {day}
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        
                                        <td className="sticky left-[5.5rem] z-30 p-0 align-top">
                                            <div className="w-20 h-full min-h-[8rem] bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-[1.5rem] flex flex-col items-center justify-center shadow-sm">
                                                <div className="font-black text-gray-800 dark:text-slate-200 text-xl">{sch.details.semester}</div>
                                                <div className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Sem</div>
                                            </div>
                                        </td>

                                        {masterPeriods.map((period, pIdx) => {
                                            if (period.isBreak) {
                                                if (index === 0) {
                                                    const letter = RECESS_LETTERS[dayIndex] || '•';
                                                    return (
                                                        <td 
                                                            key={period.id} 
                                                            rowSpan={academicSchedules.length + (externalSchedule ? 1 : 0)}
                                                            className="p-0 align-middle text-center"
                                                        >
                                                            <div className="flex items-center justify-center">
                                                                <span className="text-2xl font-black text-gray-200 dark:text-slate-700 select-none">
                                                                    {letter}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                }
                                                return null;
                                            }

                                            // Check previous period for spanning practicals
                                            if (pIdx > 0) {
                                                const prevSlot = findSlot(sch, day, masterPeriods[pIdx - 1].id);
                                                if (prevSlot?.type === 'Practical' && (prevSlot.duration || 1) > 1) {
                                                    return <td key={period.id} className="p-0 hidden" />; // Hidden cell logic
                                                }
                                            }

                                            const slot = findSlot(sch, day, period.id);
                                            const subject = slot ? sch.subjects.find(s => s.id === slot.subjectId) : null;
                                            const colorName = getSubjectColorName(sch.subjects, slot?.subjectId || '');
                                            const styles = getColorClasses(colorName);

                                            return (
                                                <td 
                                                    key={period.id} 
                                                    colSpan={slot?.type === 'Practical' && (slot.duration || 1) > 1 ? 2 : 1}
                                                    className="p-0 align-top h-full"
                                                >
                                                    <div 
                                                        onClick={() => handleCellClick(sch, day, period.id)}
                                                        className={`
                                                            h-full min-h-[8rem] rounded-[1.5rem] transition-all duration-300 cursor-pointer border relative overflow-hidden group/cell
                                                            ${slot 
                                                                ? `${styles.bg} ${styles.border} hover:shadow-lg hover:scale-[1.02] shadow-sm` 
                                                                : 'bg-white/20 dark:bg-slate-800/20 border-white/20 dark:border-slate-700/20 border-dashed hover:border-primary-300/50 hover:bg-white/40 dark:hover:bg-slate-700/40'
                                                            }
                                                        `}
                                                    >
                                                        {slot && subject ? (
                                                            <div className="p-4 h-full flex flex-col justify-between relative z-10">
                                                                {/* Header */}
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm ${styles.pill}`}>
                                                                        {slot.type === 'Practical' ? 'Lab' : 'Theory'}
                                                                    </span>
                                                                    <span className={`text-[9px] font-bold opacity-60 ${styles.text}`}>
                                                                        {subject.code}
                                                                    </span>
                                                                </div>

                                                                {/* Body */}
                                                                <div className={`text-sm font-black leading-tight line-clamp-2 drop-shadow-sm ${styles.text}`}>
                                                                    {subject.name}
                                                                </div>

                                                                {/* Footer */}
                                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                                                                    <div className={`p-1 rounded-full ${styles.pill}`}>
                                                                        <User size={10} className={styles.icon} strokeWidth={3} />
                                                                    </div>
                                                                    <span className={`text-[10px] font-bold truncate ${styles.lightText}`}>
                                                                        {getFacultyInitials(sch.faculties, slot.facultyIds)}
                                                                    </span>
                                                                </div>

                                                                 {/* Conflict Indicator */}
                                                                {(() => {
                                                                    const hasConflict = slot.facultyIds.some(fid => {
                                                                        return checkConflict(sch.id, day, period.id, fid) !== null;
                                                                    });
                                                                    return hasConflict ? (
                                                                         <div className="absolute top-1 right-1">
                                                                            <AlertTriangle size={12} className="text-red-500 animate-pulse" />
                                                                         </div>
                                                                    ) : null;
                                                                })()}
                                                            </div>
                                                        ) : (
                                                            <div className="h-full flex flex-col items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all">
                                                                <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-500 mb-1 shadow-sm">
                                                                    <Plus size={16} strokeWidth={3} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="p-0" />
                                    </tr>
                                ))}

                                {/* External Busy Row - Revised to show all busy slots */}
                                {externalSchedule && (
                                    <tr className="group/row">
                                        <td className="sticky left-[5.5rem] z-30 p-0 align-top">
                                            <div className="w-20 h-full min-h-[8rem] bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-[1.5rem] flex flex-col items-center justify-center shadow-sm">
                                                <div className="font-black text-slate-500 dark:text-slate-400 text-xs text-center leading-tight">External<br/>Dept</div>
                                            </div>
                                        </td>
                                        {masterPeriods.map((period) => {
                                            if (period.isBreak) return null;
                                            
                                            // Find all slots for this cell
                                            const busySlots = externalSchedule.timeSlots.filter(s => s.day === day && s.period === period.id);

                                            return (
                                                <td key={period.id} className="p-0 align-top h-full">
                                                    <div 
                                                        className={`
                                                            h-full min-h-[8rem] rounded-[1.5rem] transition-all duration-300 border relative overflow-hidden flex flex-col
                                                            bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 border-dashed hover:border-slate-300 hover:bg-slate-100/40 dark:hover:bg-slate-800/40
                                                        `}
                                                    >
                                                        {busySlots.length > 0 ? (
                                                            <div className="p-2 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[12rem] no-scrollbar">
                                                                {busySlots.map(slot => (
                                                                    <div 
                                                                        key={slot.id}
                                                                        onClick={() => handleCellClick(externalSchedule, day, period.id, slot)}
                                                                        className="bg-slate-200/80 dark:bg-slate-700/80 rounded-xl p-2 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors border border-slate-300/50 dark:border-slate-600/50"
                                                                    >
                                                                        <div className="flex justify-between items-start mb-1">
                                                                             <span className="text-[8px] font-black uppercase tracking-wider bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                                                                                 {slot.externalDetails?.dept || 'External'}
                                                                             </span>
                                                                             <div className="flex gap-1">
                                                                                 {slot.facultyIds.some(fid => checkConflict(EXTERNAL_BUSY_ID, day, period.id, fid)) && (
                                                                                     <AlertTriangle size={10} className="text-red-500" />
                                                                                 )}
                                                                             </div>
                                                                        </div>
                                                                        <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">
                                                                            {slot.externalDetails?.subject} {slot.externalDetails?.semester ? `(${slot.externalDetails.semester})` : ''}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {slot.facultyIds.map(fid => {
                                                                                const fac = allFaculties.find(f => f.id === fid);
                                                                                const conflict = checkConflict(EXTERNAL_BUSY_ID, day, period.id, fid);
                                                                                return (
                                                                                    <span key={fid} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 ${conflict ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white/50 text-slate-600 border-slate-300/50'}`}>
                                                                                        {fac?.initials || '??'}
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {/* Small add button at bottom of list */}
                                                                <button 
                                                                    onClick={() => handleCellClick(externalSchedule, day, period.id)}
                                                                    className="w-full py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors"
                                                                >
                                                                    <Plus size={12} strokeWidth={3} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div 
                                                                onClick={() => handleCellClick(externalSchedule, day, period.id)}
                                                                className="h-full flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer"
                                                            >
                                                                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-slate-500 mb-1 shadow-sm">
                                                                    <UserX size={16} strokeWidth={2.5} />
                                                                </div>
                                                                <span className="text-[8px] font-bold uppercase text-slate-400">Add Busy</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="p-0" />
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="h-20" />
        </div>

        {/* Modals */}
        {editingCell && mergedScheduleForModal && (
            <ClassModal 
                data={tempSlot}
                schedule={mergedScheduleForModal}
                day={editingCell.day}
                periodLabel={masterPeriods.find(p => p.id === editingCell.periodId)?.label}
                onClose={() => setEditingCell(null)}
                onSave={handleSaveSlot}
                onDelete={handleDeleteSlot}
                conflicts={getConflictsForCell()}
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