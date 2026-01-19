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
  
  const { academicSchedules, externalSchedule } = useMemo(() => {
    const academic = localSchedules.filter(s => s.id !== EXTERNAL_BUSY_ID).sort((a, b) => {
        const semA = parseInt(a.details.semester) || 0;
        const semB = parseInt(b.details.semester) || 0;
        return semA - semB;
    });
    const external = localSchedules.find(s => s.id === EXTERNAL_BUSY_ID);
    return { academicSchedules: academic, externalSchedule: external };
  }, [localSchedules]);

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
          const conf = checkConflict(editingCell.scheduleId, editingCell.day, editingCell.periodId, fid);
          if (conf) conflicts[fid] = conf;
      });
      return conflicts;
  };

  const handleCellClick = (schedule: Schedule, day: string, periodId: number, existingSlot?: TimeSlot) => {
    const period = masterPeriods.find(p => p.id === periodId);
    if (period?.isBreak) return;

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
            if (data.id) {
                newSlots = newSlots.filter(s => s.id !== data.id);
            }
        } else {
            newSlots = newSlots.filter(s => !(s.day === editingCell.day && s.period === editingCell.periodId));
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
             if (tempSlot.id) {
                newSlots = newSlots.filter(s => s.id !== tempSlot.id);
            }
        } else {
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
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
        {/* Header */}
        <div className="px-4 py-4 z-50 flex items-center justify-between shrink-0 flex-wrap gap-2 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
                <button onClick={onBack} className="h-8 w-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white leading-none tracking-tight">Department Master</h2>
                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mt-0.5">
                        {academicSchedules[0]?.details.className} • {academicSchedules[0]?.details.session}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
                 <Button 
                    onClick={handleExport} 
                    variant="secondary" 
                    icon={<Download size={14} />} 
                    disabled={isExporting}
                    size="sm"
                    className="rounded-lg border-gray-200 dark:border-slate-700"
                 >
                    <span className="hidden xs:inline">{isExporting ? 'Generating...' : 'Export'}</span>
                    <span className="xs:hidden">{isExporting ? '...' : 'PDF'}</span>
                 </Button>
                 <Button onClick={() => onSaveAll(localSchedules)} icon={<Save size={14} />} size="sm" className="shadow-glow rounded-lg px-4">
                    Save
                 </Button>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-4 relative z-10 scroll-smooth bg-gray-100 dark:bg-slate-950">
            <div id="master-grid" className="min-w-fit space-y-4">
                <table className="w-full border-separate border-spacing-1">
                    <thead className="sticky top-0 z-40">
                        <tr>
                            <th className="sticky left-0 top-0 z-50 p-0 w-16 align-bottom">
                                <div className="h-10 mb-1 bg-gray-800 dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm border border-gray-700 dark:border-slate-700">
                                    <span className="text-[10px] font-black text-white dark:text-slate-200 uppercase tracking-widest">Day</span>
                                </div>
                            </th>
                            <th className="sticky left-[4.25rem] top-0 z-50 p-0 w-14 align-bottom">
                                <div className="h-10 mb-1 bg-gray-800 dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm border border-gray-700 dark:border-slate-700">
                                    <span className="text-[10px] font-black text-white dark:text-slate-200 uppercase tracking-widest">Sem</span>
                                </div>
                            </th>
                            {masterPeriods.map(p => (
                                <th 
                                    key={p.id} 
                                    className="sticky top-0 z-40 p-0 align-bottom group cursor-pointer"
                                    onClick={() => setEditingPeriod(p)}
                                >
                                    <div className={`
                                        mb-1 mx-auto flex flex-col items-center justify-center gap-0.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-all hover:-translate-y-0.5 relative
                                        ${p.isBreak ? 'bg-gray-200 dark:bg-slate-800 w-10 min-h-[3.5rem]' : 'bg-white dark:bg-slate-800 w-36 min-h-[3.5rem] py-1'}
                                    `}>
                                        {p.isBreak ? (
                                            <>
                                                <Coffee size={12} className="text-gray-400 dark:text-slate-500" />
                                                <span className="text-[8px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest rotate-90 mt-1">Break</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 font-mono tracking-tighter uppercase">{p.label}</div>
                                                <div className="bg-gray-100 dark:bg-slate-700/50 rounded-md px-1.5">
                                                    <span className="text-[9px] font-black text-gray-700 dark:text-slate-200">{p.time}</span>
                                                </div>
                                                <Edit2 size={8} className="absolute top-1 right-1 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="sticky top-0 z-40 p-0 w-10 align-bottom">
                                <div className="h-10 w-10 mb-1 mx-auto">
                                    <button 
                                        onClick={handleAddPeriod}
                                        className="h-full w-full rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-sm flex items-center justify-center"
                                        title="Add Time Slot"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map((day, dayIndex) => (
                            <React.Fragment key={day}>
                                {academicSchedules.map((sch, index) => (
                                    <tr key={`${day}-${sch.id}`} className="group/row">
                                        {index === 0 && (
                                            <td 
                                                rowSpan={academicSchedules.length + (externalSchedule ? 1 : 0)} 
                                                className="sticky left-0 z-30 p-0 align-top"
                                            >
                                                <div className="w-16 h-[calc(100%-0.25rem)] bg-gray-800 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-md mt-0 mr-1 border border-gray-700 dark:border-slate-700">
                                                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-sm font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em]">
                                                        {day}
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        
                                        <td className="sticky left-[4.25rem] z-30 p-0 align-top">
                                            <div className="w-14 h-full min-h-[6rem] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-sm">
                                                <div className="font-black text-gray-800 dark:text-slate-200 text-lg">{sch.details.semester}</div>
                                                <div className="text-[8px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Sem</div>
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
                                                                <span className="text-xl font-black text-gray-300 dark:text-slate-700 select-none">
                                                                    {letter}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                }
                                                return null;
                                            }

                                            if (pIdx > 0) {
                                                const prevSlot = findSlot(sch, day, masterPeriods[pIdx - 1].id);
                                                if (prevSlot?.type === 'Practical' && (prevSlot.duration || 1) > 1) {
                                                    return <td key={period.id} className="p-0 hidden" />;
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
                                                            h-full min-h-[6rem] rounded-xl transition-all duration-300 cursor-pointer border relative overflow-hidden group/cell
                                                            ${slot 
                                                                ? `${styles.bg} ${styles.border} hover:shadow-md hover:scale-[1.01] shadow-sm` 
                                                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700/50 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                                            }
                                                        `}
                                                    >
                                                        {slot && subject ? (
                                                            <div className="p-2 h-full flex flex-col justify-between relative z-10">
                                                                <div className="flex justify-between items-start mb-0.5">
                                                                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm ${styles.pill}`}>
                                                                        {slot.type === 'Practical' ? 'Lab' : 'Theory'}
                                                                    </span>
                                                                    <span className={`text-[9px] font-bold opacity-60 ${styles.text}`}>
                                                                        {subject.code}
                                                                    </span>
                                                                </div>

                                                                <div className={`text-xs font-black leading-tight line-clamp-2 drop-shadow-sm ${styles.text}`}>
                                                                    {subject.name}
                                                                </div>

                                                                <div className="flex items-center gap-1 mt-1 pt-1 border-t border-black/5 dark:border-white/5">
                                                                    <div className={`p-0.5 rounded-full ${styles.pill}`}>
                                                                        <User size={8} className={styles.icon} strokeWidth={3} />
                                                                    </div>
                                                                    <span className={`text-[9px] font-bold truncate ${styles.lightText}`}>
                                                                        {getFacultyInitials(sch.faculties, slot.facultyIds)}
                                                                    </span>
                                                                </div>

                                                                {(() => {
                                                                    const hasConflict = slot.facultyIds.some(fid => {
                                                                        return checkConflict(sch.id, day, period.id, fid) !== null;
                                                                    });
                                                                    return hasConflict ? (
                                                                         <div className="absolute top-1 right-1">
                                                                            <AlertTriangle size={10} className="text-red-500 animate-pulse" />
                                                                         </div>
                                                                    ) : null;
                                                                })()}
                                                            </div>
                                                        ) : (
                                                            <div className="h-full flex flex-col items-center justify-center opacity-40 group-hover/cell:opacity-100 transition-all">
                                                                <div className="h-8 w-8 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-primary-500 mb-1 shadow-sm">
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

                                {externalSchedule && (
                                    <tr className="group/row">
                                        <td className="sticky left-[4.25rem] z-30 p-0 align-top">
                                            <div className="w-14 h-full min-h-[6rem] bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-sm">
                                                <div className="font-black text-gray-400 dark:text-slate-500 text-[9px] text-center leading-tight">External<br/>Dept</div>
                                            </div>
                                        </td>
                                        {masterPeriods.map((period) => {
                                            if (period.isBreak) return null;
                                            
                                            const busySlots = externalSchedule.timeSlots.filter(s => s.day === day && s.period === period.id);

                                            return (
                                                <td key={period.id} className="p-0 align-top h-full">
                                                    <div 
                                                        className={`
                                                            h-full min-h-[6rem] rounded-xl transition-all duration-300 border relative overflow-hidden flex flex-col
                                                            bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700
                                                        `}
                                                    >
                                                        {busySlots.length > 0 ? (
                                                            <div className="p-1 flex-1 flex flex-col gap-1 overflow-y-auto max-h-[10rem] no-scrollbar">
                                                                {busySlots.map(slot => (
                                                                    <div 
                                                                        key={slot.id}
                                                                        onClick={() => handleCellClick(externalSchedule, day, period.id, slot)}
                                                                        className="bg-white dark:bg-slate-800 rounded-lg p-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700 shadow-sm"
                                                                    >
                                                                        <div className="flex justify-between items-start mb-0.5">
                                                                             <span className="text-[7px] font-black uppercase tracking-wider bg-gray-100 dark:bg-black/20 px-1 py-px rounded-full text-gray-500 dark:text-gray-400">
                                                                                 {slot.externalDetails?.dept || 'External'}
                                                                             </span>
                                                                             <div className="flex gap-1">
                                                                                 {slot.facultyIds.some(fid => checkConflict(EXTERNAL_BUSY_ID, day, period.id, fid)) && (
                                                                                     <AlertTriangle size={8} className="text-red-500" />
                                                                                 )}
                                                                             </div>
                                                                        </div>
                                                                        <div className="text-[9px] font-bold text-gray-800 dark:text-slate-200 leading-tight mb-0.5">
                                                                            {slot.externalDetails?.subject} {slot.externalDetails?.semester ? `(${slot.externalDetails.semester})` : ''}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-0.5">
                                                                            {slot.facultyIds.map(fid => {
                                                                                const fac = allFaculties.find(f => f.id === fid);
                                                                                const conflict = checkConflict(EXTERNAL_BUSY_ID, day, period.id, fid);
                                                                                return (
                                                                                    <span key={fid} className={`text-[7px] font-bold px-1 py-px rounded-md border flex items-center gap-0.5 ${conflict ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                                        {fac?.initials || '??'}
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <button 
                                                                    onClick={() => handleCellClick(externalSchedule, day, period.id)}
                                                                    className="w-full py-1 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1 transition-colors"
                                                                >
                                                                    <Plus size={10} strokeWidth={3} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div 
                                                                onClick={() => handleCellClick(externalSchedule, day, period.id)}
                                                                className="h-full flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-all cursor-pointer"
                                                            >
                                                                <div className="h-6 w-6 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 dark:text-slate-500 mb-0.5">
                                                                    <UserX size={12} strokeWidth={2.5} />
                                                                </div>
                                                                <span className="text-[7px] font-bold uppercase text-gray-400 dark:text-slate-500">Add Busy</span>
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