import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Save, User, Plus, Edit2, Coffee, Download, AlertTriangle } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, Faculty } from '../types';
import { Button } from '../components/ui/Button';
import { generateId, getColorClasses, getSubjectColorName } from '../utils';
import { exportToPDF } from '../utils/pdf';
import { FacultyTable } from '../components/schedule/FacultyTable';
import { PeriodModal } from '../components/schedule/PeriodModal';
import { ClassModal } from '../components/schedule/ClassModal';

interface MultiSemesterEditorProps {
  schedules: Schedule[];
  onSaveAll: (schedules: Schedule[]) => void;
  onBack: () => void;
}

const RECESS_LETTERS = ['R', 'E', 'C', 'E', 'S', 'S'];

export const MultiSemesterEditor: React.FC<MultiSemesterEditorProps> = ({ schedules, onSaveAll, onBack }) => {
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(JSON.parse(JSON.stringify(schedules)));
  const [isExporting, setIsExporting] = useState(false);
  
  const sortedSchedules = useMemo(() => {
    return [...localSchedules].sort((a, b) => {
        const semA = parseInt(a.details.semester) || 0;
        const semB = parseInt(b.details.semester) || 0;
        return semA - semB;
    });
  }, [localSchedules]);

  const allFaculties = useMemo(() => {
    const map = new Map<string, Faculty>();
    localSchedules.forEach(s => {
        s.faculties.forEach(f => {
            if (!map.has(f.id)) map.set(f.id, f);
        });
    });
    return Array.from(map.values());
  }, [localSchedules]);

  const masterPeriods = sortedSchedules[0]?.periods || [];

  const [editingCell, setEditingCell] = useState<{
    scheduleId: string;
    day: string;
    periodId: number;
  } | null>(null);

  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [tempSlot, setTempSlot] = useState<Partial<TimeSlot>>({});

  const findSlot = (schedule: Schedule, day: string, periodId: number) => {
    return schedule.timeSlots.find(s => s.day === day && s.period === periodId);
  };

  const checkConflict = (scheduleId: string, day: string, periodId: number, facultyId: string) => {
    for (const s of localSchedules) {
        if (s.id === scheduleId) continue;
        const slot = s.timeSlots.find(ts => ts.day === day && ts.period === periodId);
        if (slot && slot.facultyIds.includes(facultyId)) {
            return s.details.semester + " Sem";
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

  const facultyStats = useMemo(() => {
    return allFaculties.map(fac => {
        let total = 0;
        localSchedules.forEach(s => {
             s.timeSlots
                .filter(slot => slot.facultyIds.includes(fac.id))
                .forEach(slot => { total += (slot.duration || 1); });
        });
        return { ...fac, totalDuration: total };
    });
  }, [localSchedules, allFaculties]);

  const handleCellClick = (schedule: Schedule, day: string, periodId: number) => {
    const period = masterPeriods.find(p => p.id === periodId);
    if (period?.isBreak) return;

    const existing = findSlot(schedule, day, periodId);
    setTempSlot(existing || {
        day,
        period: periodId,
        type: 'Theory',
        subjectId: '',
        facultyIds: [],
        duration: 1
    });
    setEditingCell({ scheduleId: schedule.id, day, periodId });
  };

  const handleSaveSlot = (data: Partial<TimeSlot>) => {
    if (!editingCell) return;
    
    setLocalSchedules(prev => prev.map(sch => {
        if (sch.id !== editingCell.scheduleId) return sch;

        let newSlots = sch.timeSlots.filter(s => !(s.day === editingCell.day && s.period === editingCell.periodId));
        
        if (data.type === 'Practical' && (data.duration || 1) > 1) {
             const pIndex = masterPeriods.findIndex(p => p.id === editingCell.periodId);
             if (pIndex !== -1 && pIndex < masterPeriods.length - 1) {
                 const nextPeriodId = masterPeriods[pIndex + 1].id;
                 if (!masterPeriods[pIndex+1].isBreak) {
                     newSlots = newSlots.filter(s => !(s.day === editingCell.day && s.period === nextPeriodId));
                 }
             }
        }

        if (data.subjectId && data.facultyIds?.length) {
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
        const newSlots = sch.timeSlots.filter(s => !(s.day === editingCell.day && s.period === editingCell.periodId));
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
      await exportToPDF('master-grid', `${localSchedules[0]?.details.className || 'Schedule'}_Master.pdf`);
      setIsExporting(false);
  };

  const currentEditingSchedule = localSchedules.find(s => s.id === editingCell?.scheduleId);
  // Merge all faculties for the modal selection
  const mergedScheduleForModal = currentEditingSchedule ? {
      ...currentEditingSchedule,
      faculties: allFaculties
  } : null;

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm relative flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300"/>
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">Department Master Schedule</h1>
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1">
                        {localSchedules[0]?.details.className} • {localSchedules[0]?.details.session}
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
                 >
                    <span className="hidden xs:inline">{isExporting ? 'Generating...' : 'Export PDF'}</span>
                    <span className="xs:hidden">{isExporting ? '...' : 'PDF'}</span>
                 </Button>
                 <Button onClick={() => onSaveAll(localSchedules)} icon={<Save size={18} />} size="sm" className="shadow-glow">
                    Save All
                 </Button>
            </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-slate-950/50 p-4 pb-20">
            <div id="master-grid" className="min-w-fit space-y-8 p-2 bg-white/60 dark:bg-slate-800/60">
                <div className="bg-white dark:bg-slate-800 shadow-card rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-700 min-w-max">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur sticky top-0 z-40 shadow-sm">
                            <tr>
                                <th className="border-r border-b border-gray-100 dark:border-slate-700 p-3 w-16 sticky left-0 bg-gray-50 dark:bg-slate-800 z-50 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Day</th>
                                <th className="border-r border-b border-gray-100 dark:border-slate-700 p-3 w-20 sticky left-16 bg-gray-50 dark:bg-slate-800 z-50 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Sem</th>
                                {masterPeriods.map(p => (
                                    <th 
                                        key={p.id} 
                                        className={`
                                            border-r border-b border-gray-100 dark:border-slate-700 p-2 text-center relative group cursor-pointer transition-colors hover:bg-white dark:hover:bg-slate-700
                                            ${p.isBreak ? 'bg-gray-100/50 dark:bg-slate-700/50 w-16 min-w-[60px]' : 'min-w-[160px]'}
                                        `}
                                        onClick={() => setEditingPeriod(p)}
                                    >
                                        {p.isBreak ? (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <Coffee size={14} className="text-gray-400 dark:text-slate-500 mb-1" />
                                                <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase">Break</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-xs font-bold text-gray-700 dark:text-slate-200 font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded inline-block group-hover:bg-gray-200 dark:group-hover:bg-slate-600 transition-colors">
                                                    {p.time}
                                                </div>
                                                <Edit2 size={10} className="absolute top-2 right-2 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </>
                                        )}
                                    </th>
                                ))}
                                <th className="border-b border-gray-100 dark:border-slate-700 p-2 w-16 bg-gray-50 dark:bg-slate-800 z-50">
                                    <div className="flex items-center justify-center h-full">
                                        <button 
                                            onClick={handleAddPeriod}
                                            className="h-8 w-8 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-primary-50 dark:hover:bg-slate-600 hover:border-primary-200 text-gray-400 hover:text-primary-600 flex items-center justify-center transition-all shadow-sm"
                                            title="Add Time Slot"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {DAYS.map((day, dayIndex) => (
                                <React.Fragment key={day}>
                                    {sortedSchedules.map((sch, index) => (
                                        <tr key={sch.id} className="group hover:bg-gray-50/30 dark:hover:bg-slate-700/30 transition-colors">
                                            {index === 0 && (
                                                <td 
                                                    rowSpan={sortedSchedules.length} 
                                                    className="border-r border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 sticky left-0 z-30 text-center font-black text-gray-300 dark:text-slate-600 text-sm uppercase tracking-[0.3em] p-0 align-middle shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                                                >
                                                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="mx-auto py-4">
                                                        {day}
                                                    </div>
                                                </td>
                                            )}
                                            
                                            <td className="border-r border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 sticky left-16 z-30 p-2 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="font-bold text-gray-800 dark:text-slate-200 text-sm">{sch.details.semester}</div>
                                                <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Sem</div>
                                            </td>

                                            {masterPeriods.map((period, pIndex) => {
                                                if (period.isBreak) {
                                                    if (index === 0) {
                                                        const letter = RECESS_LETTERS[dayIndex] || '';
                                                        return (
                                                            <td 
                                                                key={period.id} 
                                                                rowSpan={sortedSchedules.length}
                                                                className="bg-gray-50 dark:bg-slate-800/50 border-r border-b border-gray-100 dark:border-slate-700 align-middle text-center p-0"
                                                            >
                                                                <div className="h-full flex items-center justify-center">
                                                                    <span className="text-gray-400 dark:text-slate-600 font-black text-2xl select-none">
                                                                        {letter}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        );
                                                    }
                                                    return null;
                                                }

                                                if (pIndex > 0) {
                                                    const prevPeriod = masterPeriods[pIndex - 1];
                                                    const prevSlot = findSlot(sch, day, prevPeriod.id);
                                                    if (prevSlot && prevSlot.type === 'Practical' && (prevSlot.duration || 1) > 1) {
                                                        return null;
                                                    }
                                                }

                                                const slot = findSlot(sch, day, period.id);
                                                const conflict = slot && slot.facultyIds
                                                    ? slot.facultyIds.map(fid => checkConflict(sch.id, day, period.id, fid)).find(c => c)
                                                    : null;

                                                let colorClasses = { bg: 'bg-transparent', border: 'border-gray-200 dark:border-slate-700', text: 'text-gray-900 dark:text-slate-200', lightText: 'text-gray-500 dark:text-slate-400', pill: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300' };
                                                if (slot) {
                                                    const colorName = getSubjectColorName(sch.subjects, slot.subjectId);
                                                    colorClasses = getColorClasses(colorName);
                                                }

                                                return (
                                                    <td 
                                                        key={period.id} 
                                                        colSpan={slot?.type === 'Practical' && (slot.duration || 1) > 1 ? slot.duration : 1}
                                                        onClick={() => handleCellClick(sch, day, period.id)}
                                                        className={`
                                                            border-r border-b border-gray-100 dark:border-slate-700 p-2 cursor-pointer relative align-top
                                                            ${slot?.type === 'Practical' && (slot.duration || 1) > 1 ? 'min-w-[320px]' : ''}
                                                        `}
                                                    >
                                                        <div className={`
                                                            h-32 w-full rounded-[1.5rem] transition-all duration-300 flex flex-col relative overflow-hidden group/cell
                                                            ${slot 
                                                                ? `${colorClasses.bg} border border-transparent hover:border-${colorClasses.border.split('-')[1]}-300 p-4 justify-between shadow-sm hover:shadow-md hover:-translate-y-1` 
                                                                : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 justify-center items-center hover:shadow-soft'
                                                            }
                                                            ${conflict ? 'ring-2 ring-red-500 ring-offset-1' : ''}
                                                        `}>
                                                            {slot ? (
                                                                <>
                                                                    <div className="flex justify-between items-start">
                                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${colorClasses.pill}`}>
                                                                            {slot.type === 'Practical' ? 'Lab' : 'Theory'}
                                                                        </span>
                                                                        <span className={`text-[10px] font-bold opacity-60 ${colorClasses.text}`}>
                                                                            {sch.subjects.find(s => s.id === slot.subjectId)?.code}
                                                                        </span>
                                                                    </div>

                                                                    <div className={`font-bold text-sm leading-tight line-clamp-2 mt-1 ${colorClasses.text}`}>
                                                                        {sch.subjects.find(s => s.id === slot.subjectId)?.name}
                                                                    </div>

                                                                    <div className={`flex items-center gap-1.5 mt-auto pt-2 border-t border-black/5 dark:border-white/10 ${colorClasses.lightText}`}>
                                                                        <User size={10} strokeWidth={3} />
                                                                        <span className="text-[10px] font-bold truncate">
                                                                            {slot.facultyIds.map(fid => {
                                                                                const f = sch.faculties.find(fac => fac.id === fid) || allFaculties.find(fac => fac.id === fid);
                                                                                return f?.initials;
                                                                            }).join(', ')}
                                                                        </span>
                                                                    </div>

                                                                    {conflict && (
                                                                        <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm animate-pulse" title={`Conflict in ${conflict}`}>
                                                                            <AlertTriangle size={10} />
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="h-10 w-10 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-500 mb-2 shadow-sm group-hover/cell:bg-primary-500 group-hover/cell:text-white transition-all duration-300 transform group-hover/cell:scale-110">
                                                                        <Plus size={24} strokeWidth={3} />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/20 dark:bg-slate-900/50"></td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <FacultyTable stats={facultyStats} />
            </div>
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