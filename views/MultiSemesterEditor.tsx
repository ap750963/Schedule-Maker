import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, User, Plus, Edit2, Coffee, Download, AlertTriangle, Building, Trash2 } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, Faculty } from '../types';
import { Button } from '../components/ui/Button';
import { generateId, getColorClasses, getSubjectColorName } from '../utils';
import { exportToPDF } from '../utils/pdf';
import { FacultyTable } from '../components/schedule/FacultyTable';
import { PeriodModal } from '../components/schedule/PeriodModal';
import { ClassModal } from '../components/schedule/ClassModal';
import { ExternalBusyModal } from '../components/schedule/ExternalBusyModal';

interface MultiSemesterEditorProps {
  schedules: Schedule[];
  onSaveAll: (schedules: Schedule[]) => void;
  onBack: () => void;
}

const RECESS_LETTERS = ['R', 'E', 'C', 'E', 'S', 'S'];

export const MultiSemesterEditor: React.FC<MultiSemesterEditorProps> = ({ schedules, onSaveAll, onBack }) => {
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(JSON.parse(JSON.stringify(schedules)));
  const [isExporting, setIsExporting] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [externalModalDefaults, setExternalModalDefaults] = useState<{day?: string, periodId?: number}>({});
  
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
            else {
                 const existing = map.get(f.id)!;
                 if ((f.externalSlots?.length || 0) > (existing.externalSlots?.length || 0)) {
                     map.set(f.id, f);
                 }
            }
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
            return `${s.details.semester} Sem (Internal)`;
        }
    }
    const faculty = allFaculties.find(f => f.id === facultyId);
    if (faculty?.externalSlots) {
        const extSlot = faculty.externalSlots.find(s => s.day === day && s.periodId === periodId);
        if (extSlot) {
            return `${extSlot.details.department} - ${extSlot.details.semester} Sem (${extSlot.details.subject})`;
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
        if (fac.externalSlots) {
            total += fac.externalSlots.length;
        }
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
     setEditingPeriod({ id: 0, label: `Hour ${masterPeriods.length + 1}`, time: '09:00 - 10:00', isBreak: false });
  };

  const handleSaveExternalBusy = (facultyIds: string[], day: string, periodId: number, details: { department: string; semester: string; subject: string }) => {
      setLocalSchedules(prev => prev.map(sch => ({
          ...sch,
          faculties: sch.faculties.map(f => {
              if (facultyIds.includes(f.id)) {
                  const newSlot = { id: generateId(), day, periodId, details };
                  return { ...f, externalSlots: [...(f.externalSlots || []), newSlot] };
              }
              return f;
          })
      })));
  };

  const handleDeleteExternalBusy = (facultyId: string, slotId: string) => {
      setLocalSchedules(prev => prev.map(sch => ({
          ...sch,
          faculties: sch.faculties.map(f => {
              if (f.id === facultyId) {
                  return { ...f, externalSlots: (f.externalSlots || []).filter(s => s.id !== slotId) };
              }
              return f;
          })
      })));
  };

  const handleExport = async () => {
      setIsExporting(true);
      await exportToPDF('master-grid', `${localSchedules[0]?.details.className || 'Schedule'}_Master.pdf`);
      setIsExporting(false);
  };

  const currentEditingSchedule = localSchedules.find(s => s.id === editingCell?.scheduleId);
  const mergedScheduleForModal = currentEditingSchedule ? {
      ...currentEditingSchedule,
      faculties: allFaculties
  } : null;

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-5 py-3 flex justify-between items-center shrink-0 z-50 shadow-sm relative flex-wrap gap-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft size={18} className="text-gray-600 dark:text-slate-300"/>
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white leading-none">Master View</h1>
                    <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400 mt-0.5">
                        {localSchedules[0]?.details.className} • {localSchedules[0]?.details.session}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
                 <Button 
                    onClick={() => { setExternalModalDefaults({}); setShowExternalModal(true); }} 
                    variant="secondary" 
                    icon={<Building size={14} />} 
                    size="sm" 
                    className="hidden sm:inline-flex border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-900/50 dark:text-rose-300 rounded-full px-4"
                 >
                    Busy Slots
                 </Button>
                 <button onClick={() => { setExternalModalDefaults({}); setShowExternalModal(true); }} className="sm:hidden h-8 w-8 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
                    <Building size={14} />
                 </button>

                 <Button 
                    onClick={handleExport} 
                    variant="secondary" 
                    icon={<Download size={16} />} 
                    disabled={isExporting}
                    size="sm"
                    className="rounded-full px-4"
                 >
                    <span className="hidden xs:inline">{isExporting ? '...' : 'Export'}</span>
                    <span className="xs:hidden">{isExporting ? '...' : 'PDF'}</span>
                 </Button>
                 <Button onClick={() => onSaveAll(localSchedules)} icon={<Save size={16} />} size="sm" className="shadow-glow rounded-full px-6">
                    Save
                 </Button>
            </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-slate-950/50 p-4 pb-20 no-scrollbar">
            <div id="master-grid" className="min-w-fit space-y-8 p-2">
                <div className="bg-white dark:bg-slate-800 shadow-soft rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-slate-700/50 min-w-max">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur sticky top-0 z-40 shadow-sm">
                            <tr>
                                <th className="border-r border-b border-gray-100 dark:border-slate-700 p-2 w-10 sticky left-0 bg-gray-50 dark:bg-slate-800 z-50 text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Day</th>
                                <th className="border-r border-b border-gray-100 dark:border-slate-700 p-2 w-14 sticky left-10 bg-gray-50 dark:bg-slate-800 z-50 text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Sem</th>
                                {masterPeriods.map(p => (
                                    <th 
                                        key={p.id} 
                                        className={`
                                            border-r border-b border-gray-100 dark:border-slate-700 p-1.5 text-center relative group cursor-pointer transition-colors hover:bg-white dark:hover:bg-slate-700
                                            ${p.isBreak ? 'bg-gray-100/50 dark:bg-slate-700/50 w-12 min-w-[48px]' : 'min-w-[140px]'}
                                        `}
                                        onClick={() => setEditingPeriod(p)}
                                    >
                                        {p.isBreak ? (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <Coffee size={12} className="text-gray-400 dark:text-slate-500 mb-0.5" />
                                                <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase">Break</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-[10px] font-black text-gray-700 dark:text-slate-200 font-mono bg-gray-200/50 dark:bg-slate-700 px-2 py-0.5 rounded-full inline-block group-hover:bg-gray-200 dark:group-hover:bg-slate-600 transition-colors">
                                                    {p.time}
                                                </div>
                                                <Edit2 size={8} className="absolute top-1 right-1 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </>
                                        )}
                                    </th>
                                ))}
                                <th className="border-b border-gray-100 dark:border-slate-700 p-1 w-12 bg-gray-50 dark:bg-slate-800 z-50">
                                    <div className="flex items-center justify-center h-full">
                                        <button 
                                            onClick={handleAddPeriod}
                                            className="h-7 w-7 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-primary-50 dark:hover:bg-slate-600 hover:border-primary-200 text-gray-400 hover:text-primary-600 flex items-center justify-center transition-all shadow-sm"
                                            title="Add Slot"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {DAYS.map((day, dayIndex) => (
                                <React.Fragment key={day}>
                                    {sortedSchedules.map((sch, index) => (
                                        <tr key={sch.id} className="group hover:bg-gray-50/10 dark:hover:bg-slate-700/10 transition-colors">
                                            {index === 0 && (
                                                <td 
                                                    rowSpan={sortedSchedules.length + 1} 
                                                    className="border-r border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 sticky left-0 z-30 text-center font-black text-gray-300 dark:text-slate-700 text-[11px] uppercase tracking-[0.3em] p-0 align-middle shadow-[2px_0_10px_-4px_rgba(0,0,0,0.1)]"
                                                >
                                                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="mx-auto py-2">
                                                        {day}
                                                    </div>
                                                </td>
                                            )}
                                            
                                            <td className="border-r border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 sticky left-10 z-30 p-1 text-center shadow-[2px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                                <div className="font-black text-gray-800 dark:text-slate-200 text-xs">{sch.details.semester}</div>
                                                <div className="text-[8px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Sem</div>
                                            </td>

                                            {masterPeriods.map((period, pIndex) => {
                                                if (period.isBreak) {
                                                    if (index === 0) {
                                                        const letter = RECESS_LETTERS[dayIndex] || '';
                                                        return (
                                                            <td 
                                                                key={period.id} 
                                                                rowSpan={sortedSchedules.length + 1}
                                                                className="bg-gray-50 dark:bg-slate-800/50 border-r border-b border-gray-100 dark:border-slate-700 align-middle text-center p-0"
                                                            >
                                                                <div className="h-full flex items-center justify-center">
                                                                    <span className="text-gray-200 dark:text-slate-700 font-black text-2xl select-none">
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

                                                let colorClasses = { bg: 'bg-transparent', border: 'border-gray-100 dark:border-slate-700', text: 'text-gray-900 dark:text-slate-200', lightText: 'text-gray-500 dark:text-slate-400', pill: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300' };
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
                                                            border-r border-b border-gray-100 dark:border-slate-700 p-1.5 cursor-pointer relative align-top
                                                            ${slot?.type === 'Practical' && (slot.duration || 1) > 1 ? 'min-w-[280px]' : ''}
                                                        `}
                                                    >
                                                        <div className={`
                                                            h-20 w-full rounded-full transition-all duration-300 flex flex-col relative overflow-hidden group/cell
                                                            ${slot 
                                                                ? `${colorClasses.bg} border border-transparent hover:border-${colorClasses.border.split('-')[1]}-400 p-2.5 justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5` 
                                                                : 'bg-white/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-800 justify-center items-center'
                                                            }
                                                            ${conflict ? 'ring-2 ring-red-500 ring-offset-2' : ''}
                                                        `}>
                                                            {slot ? (
                                                                <>
                                                                    <div className="flex justify-between items-start mb-0.5">
                                                                        <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${colorClasses.pill}`}>
                                                                            {slot.type === 'Practical' ? 'Lab' : 'Theory'}
                                                                        </span>
                                                                        <span className={`text-[8px] font-black opacity-40 ${colorClasses.text}`}>
                                                                            {sch.subjects.find(s => s.id === slot.subjectId)?.code}
                                                                        </span>
                                                                    </div>

                                                                    <div className={`font-black text-[10px] leading-tight line-clamp-1 ${colorClasses.text}`}>
                                                                        {sch.subjects.find(s => s.id === slot.subjectId)?.name}
                                                                    </div>

                                                                    <div className={`flex items-center gap-1 mt-1 pt-1 border-t border-black/5 dark:border-white/10 ${colorClasses.lightText}`}>
                                                                        <User size={8} strokeWidth={3} />
                                                                        <span className="text-[8px] font-black truncate">
                                                                            {slot.facultyIds.map(fid => {
                                                                                const f = sch.faculties.find(fac => fac.id === fid) || allFaculties.find(fac => fac.id === fid);
                                                                                return f?.initials;
                                                                            }).join(', ')}
                                                                        </span>
                                                                    </div>

                                                                    {conflict && (
                                                                        <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm animate-pulse">
                                                                            <AlertTriangle size={8} />
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="h-6 w-6 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-500 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                                    <Plus size={14} strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/10 dark:bg-slate-900/10"></td>
                                        </tr>
                                    ))}
                                    
                                    {/* --- External Busy Row --- */}
                                    <tr className="bg-rose-50/10 dark:bg-rose-900/5">
                                        <td className="border-r border-b border-gray-100 dark:border-slate-700 bg-rose-50/20 dark:bg-rose-900/10 sticky left-10 z-30 p-1 text-center align-middle">
                                            <div className="flex flex-col items-center justify-center h-full gap-0.5">
                                                <div className="h-4 w-4 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
                                                    <Building size={8} />
                                                </div>
                                                <div className="text-[7px] font-black text-rose-400 dark:text-rose-400 uppercase tracking-widest">Ext</div>
                                            </div>
                                        </td>

                                        {masterPeriods.map(period => {
                                            if (period.isBreak) return null; 

                                            const busyFaculties = allFaculties.flatMap(f => 
                                                (f.externalSlots || [])
                                                .filter(s => s.day === day && s.periodId === period.id)
                                                .map(s => ({ ...s, faculty: f }))
                                            );

                                            return (
                                                <td 
                                                    key={`ext-${day}-${period.id}`}
                                                    onClick={() => {
                                                        setExternalModalDefaults({ day, periodId: period.id });
                                                        setShowExternalModal(true);
                                                    }}
                                                    className="border-r border-b border-gray-100 dark:border-slate-700 p-1 align-top hover:bg-rose-50/20 dark:hover:bg-rose-900/10 cursor-pointer transition-colors group/ext"
                                                >
                                                    <div className="min-h-[30px] flex flex-wrap gap-1 relative">
                                                        {busyFaculties.length === 0 && (
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/ext:opacity-100 transition-opacity">
                                                                <Plus size={12} className="text-rose-300" />
                                                            </div>
                                                        )}
                                                        {busyFaculties.map((item, idx) => (
                                                            <div 
                                                                key={`${item.id}-${idx}`}
                                                                className="bg-white/80 dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 group/chip transition-all"
                                                                onClick={(e) => e.stopPropagation()} 
                                                            >
                                                                <span className="text-[8px] font-black text-gray-700 dark:text-slate-200 uppercase">{item.faculty.initials}</span>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteExternalBusy(item.faculty.id, item.id);
                                                                    }}
                                                                    className="text-rose-300 hover:text-rose-500 opacity-0 group-hover/chip:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 size={8} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/10 dark:bg-slate-900/10"></td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="max-w-xl">
                    <FacultyTable stats={facultyStats} />
                </div>
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

        {showExternalModal && (
            <ExternalBusyModal
                faculties={allFaculties}
                periods={masterPeriods}
                initialDay={externalModalDefaults.day}
                initialPeriodId={externalModalDefaults.periodId}
                onClose={() => setShowExternalModal(false)}
                onSave={handleSaveExternalBusy}
            />
        )}
    </div>
  );
};