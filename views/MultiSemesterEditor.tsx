
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Plus, Coffee, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, Faculty } from '../types';
import { Button } from '../components/ui/Button';
import { generateId, getColorClasses, getSubjectColorName, isTimeOverlap, getSlotInterval } from '../utils';
import { exportMasterToExcel } from '../utils/excel';
import { FacultyTable } from '../components/schedule/FacultyTable';
import { PeriodModal } from '../components/schedule/PeriodModal';
import { ClassModal } from '../components/schedule/ClassModal';

// Define the missing MultiSemesterEditorProps interface
interface MultiSemesterEditorProps {
  schedules: Schedule[];
  onSaveAll: (updatedSchedules: Schedule[]) => void;
  onBack: () => void;
}

export const MultiSemesterEditor: React.FC<MultiSemesterEditorProps> = ({ schedules, onSaveAll, onBack }) => {
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(JSON.parse(JSON.stringify(schedules)));
  const activeSchedules = localSchedules; 

  const allFaculties = useMemo(() => {
    const map = new Map<string, Faculty>();
    localSchedules.forEach(s => {
        s.faculties.forEach(f => {
            if (!map.has(f.id)) map.set(f.id, f);
        });
    });
    return Array.from(map.values());
  }, [localSchedules]);

  const masterPeriods = activeSchedules[0]?.periods || [];

  const [editingCell, setEditingCell] = useState<{
    scheduleId: string;
    day: string;
    periodId: number;
    branch?: string; 
  } | null>(null);

  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [tempSlot, setTempSlot] = useState<Partial<TimeSlot>>({});

  const findSlot = (schedule: Schedule, day: string, periodId: number, branch?: string) => {
    return schedule.timeSlots.find(s => s.day === day && s.period === periodId && (branch ? s.branch === branch : true));
  };

  const checkConflict = (scheduleId: string, day: string, periodId: number, facultyId: string, branch?: string) => {
    const targetFaculty = allFaculties.find(f => f.id === facultyId);
    if (!targetFaculty) return null;

    const currentSchedule = localSchedules.find(s => s.id === scheduleId);
    if (!currentSchedule) return null;
    const currentSlot = findSlot(currentSchedule, day, periodId, branch);
    
    const interval = currentSlot 
        ? getSlotInterval(currentSlot, currentSchedule.periods)
        : getSlotInterval({ day, period: periodId, duration: 1 } as TimeSlot, currentSchedule.periods);
    
    if (!interval) return null;

    for (const s of localSchedules) {
        if (s.details.session !== currentSchedule.details.session) continue;

        for (const slot of s.timeSlots) {
            if (slot.day !== day) continue;
            const hasTeacherMatch = slot.facultyIds.some(fid => {
                const facInSlot = s.faculties.find(f => f.id === fid);
                return facInSlot && facInSlot.initials === targetFaculty.initials;
            });
            if (hasTeacherMatch) {
                const slotInterval = getSlotInterval(slot, s.periods);
                if (slotInterval) {
                    const overlap = isTimeOverlap(interval.start, interval.end, slotInterval.start, slotInterval.end);
                    const isSelf = s.id === scheduleId && slot.period === periodId && (!slot.branch || slot.branch === branch);
                    if (overlap && !isSelf) return `${s.details.className} (Sem ${s.details.semester})`;
                }
            }
        }
    }
    return null;
  };

  const facultyStats = useMemo(() => {
    return allFaculties.map(fac => {
        let total = 0;
        localSchedules.forEach(s => {
             s.timeSlots
                .filter(slot => slot.facultyIds.some(fid => s.faculties.find(f => f.id === fid)?.initials === fac.initials))
                .forEach(slot => { total += (slot.duration || 1); });
        });
        return { ...fac, totalDuration: total };
    });
  }, [localSchedules, allFaculties]);

  const handleCellClick = (schedule: Schedule, day: string, periodId: number, branch?: string) => {
    const period = schedule.periods.find(p => p.id === periodId);
    if (period?.isBreak) return;

    const existing = findSlot(schedule, day, periodId, branch);
    setTempSlot(existing || { day, period: periodId, type: 'Theory', subjectId: '', facultyIds: [], duration: 1, branch });
    setEditingCell({ scheduleId: schedule.id, day, periodId, branch });
  };

  const handleSaveSlot = (data: Partial<TimeSlot>) => {
    if (!editingCell) return;
    setLocalSchedules(prev => prev.map(sch => {
        if (sch.id !== editingCell.scheduleId) return sch;
        let newSlots = sch.timeSlots.filter(s => !(s.day === editingCell.day && s.period === editingCell.periodId && (editingCell.branch ? s.branch === editingCell.branch : true)));
        if (data.subjectId && data.facultyIds?.length) {
            newSlots.push({ ...data as TimeSlot, id: data.id || generateId(), branch: editingCell.branch });
        }
        return { ...sch, timeSlots: newSlots, lastModified: Date.now() };
    }));
    setEditingCell(null);
  };

  const handleSavePeriod = (updatedPeriod: Period, startTime: string, endTime: string) => {
    const time = `${startTime} - ${endTime}`;
    setLocalSchedules(prev => prev.map(s => {
        let list = [...s.periods];
        if (updatedPeriod.id === 0) {
            const maxId = Math.max(0, ...list.map(x => x.id));
            list.push({ ...updatedPeriod, id: maxId + 1, time });
        } else {
            list = list.map(x => x.id === updatedPeriod.id ? { ...updatedPeriod, time } : x);
        }
        return { ...s, periods: list };
    }));
    setEditingPeriod(null);
  };

  const totalTableRows = useMemo(() => {
      return DAYS.length * activeSchedules.reduce((acc, curr) => acc + (curr.details.level === '1st-year' ? (curr.details.branches?.length || 1) : 1), 0);
  }, [activeSchedules]);

  return (
    <div className="h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300 overflow-hidden font-sans">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-50 shadow-sm relative shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="h-10 w-10 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-500 hover:text-primary-600 transition-all shadow-sm"><ArrowLeft size={22} /></button>
                <div>
                    <h1 className="text-xl font-black dark:text-white leading-none tracking-tight">College Master Schedule</h1>
                    <p className="text-[11px] text-gray-400 font-black uppercase mt-1.5 tracking-[0.2em]">{activeSchedules[0]?.details.session || '2024-25'}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                 <Button onClick={() => exportMasterToExcel(activeSchedules)} variant="secondary" icon={<FileSpreadsheet size={18} />} size="sm" className="rounded-2xl">Excel</Button>
                 <Button onClick={() => onSaveAll(localSchedules)} icon={<Save size={18} />} size="sm" className="rounded-2xl shadow-glow">Save All</Button>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50/30 dark:bg-slate-950/30">
            <div id="master-grid" className="min-w-fit space-y-12">
                <div className="bg-white dark:bg-slate-900 shadow-soft rounded-[3rem] overflow-hidden border border-gray-200 dark:border-slate-800">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-100/90 dark:bg-slate-800/90 sticky top-0 z-40">
                            <tr>
                                <th className="border-r border-b border-gray-200 dark:border-slate-700 p-4 w-12 sticky left-0 bg-gray-100 dark:bg-slate-800 text-[11px] font-black uppercase text-gray-400 tracking-widest">Day</th>
                                <th className="border-r border-b border-gray-200 dark:border-slate-700 p-4 w-20 sticky left-12 bg-gray-100 dark:bg-slate-800 text-[11px] font-black uppercase text-gray-400 tracking-widest text-center">Context</th>
                                {masterPeriods.map(p => (
                                    <th 
                                      key={p.id} 
                                      onClick={() => setEditingPeriod(p)}
                                      className={`border-r border-b border-gray-200 dark:border-slate-700 p-4 text-center min-w-[160px] cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors group ${p.isBreak ? 'bg-gray-100/30 dark:bg-slate-800/40' : ''}`}
                                    >
                                        {p.isBreak ? (
                                           <div className="flex flex-col items-center opacity-40">
                                              <Coffee size={14} className="mb-1 text-gray-400 dark:text-slate-400" />
                                              <span className="text-[11px] font-black uppercase tracking-widest dark:text-slate-300">Recess</span>
                                           </div>
                                        ) : (
                                          <div className="flex flex-col items-center">
                                            <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.05em] mb-1 group-hover:scale-105 transition-transform">{p.time}</div>
                                          </div>
                                        )}
                                    </th>
                                ))}
                                <th className="border-b border-gray-200 dark:border-slate-700 p-2 bg-gray-100 dark:bg-slate-800">
                                  <button onClick={() => setEditingPeriod({ id: 0, label: 'New', time: '09:00 - 10:00', isBreak: false })} className="p-2 text-gray-300 hover:text-primary-500 transition-colors"><Plus size={24} strokeWidth={3} /></button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {DAYS.map((day, dIdx) => {
                                const rowCoveredMap: Record<string, Set<number>> = {};
                                
                                return (
                                <React.Fragment key={day}>
                                    {activeSchedules.map((sch, sIdx) => {
                                        const subRows = sch.details.level === '1st-year' ? (sch.details.branches || ['Batch A']) : [sch.details.semester];
                                        return subRows.map((sub, rIdx) => {
                                            const rowKey = `${sch.id}-${sub}`;
                                            if (!rowCoveredMap[rowKey]) rowCoveredMap[rowKey] = new Set();
                                            
                                            return (
                                            <tr key={rowKey} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                {sIdx === 0 && rIdx === 0 && (
                                                    <td rowSpan={activeSchedules.reduce((acc, curr) => acc + (curr.details.level === '1st-year' ? (curr.details.branches?.length || 1) : 1), 0)} className="border-r border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky left-0 z-30 text-center font-black text-gray-400 text-[12px] uppercase p-0">
                                                        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="mx-auto py-6 tracking-[0.5em]">{day}</div>
                                                    </td>
                                                )}
                                                <td className="border-r border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky left-12 z-30 p-3 text-center shadow-sm">
                                                    <div className="text-[11px] font-black text-gray-900 dark:text-white uppercase truncate max-w-[60px] tracking-tight">{sch.details.level === '1st-year' ? sub : `SEM ${sub}`}</div>
                                                </td>
                                                {sch.periods.map((period, pIdx) => {
                                                    if (period.isBreak) {
                                                      if (dIdx === 0 && sIdx === 0 && rIdx === 0) {
                                                        return (
                                                          <td key={period.id} rowSpan={totalTableRows} className="border-r border-b border-gray-200 dark:border-slate-700 bg-gray-100/30 dark:bg-slate-800/30 text-center align-middle p-0">
                                                            <div className="flex flex-col items-center justify-center leading-none">
                                                                {"RECESS".split("").map((letter, i) => (
                                                                    <span key={i} className="text-4xl font-black text-gray-300 dark:text-slate-400/60 my-2">{letter}</span>
                                                                ))}
                                                            </div>
                                                          </td>
                                                        );
                                                      }
                                                      return null;
                                                    }
                                                    
                                                    if (rowCoveredMap[rowKey].has(period.id)) return null;

                                                    const slotBranch = sch.details.level === '1st-year' ? sub : undefined;
                                                    const slot = findSlot(sch, day, period.id, slotBranch);
                                                    let colSpan = 1;
                                                    
                                                    if (slot && slot.type === 'Practical' && (slot.duration || 1) > 1) {
                                                         const duration = slot.duration || 1;
                                                         let academicCount = 1;
                                                         
                                                         for (let i = pIdx + 1; i < sch.periods.length; i++) {
                                                             colSpan++;
                                                             const p = sch.periods[i];
                                                             
                                                             if (!p.isBreak) {
                                                                 academicCount++;
                                                                 rowCoveredMap[rowKey].add(p.id);
                                                             }
                                                             
                                                             if (academicCount >= duration) break;
                                                         }
                                                    }

                                                    const conflict = slot && slot.facultyIds.map(fid => checkConflict(sch.id, day, period.id, fid, slotBranch)).find(c => c);
                                                    const colorClasses = slot ? getColorClasses(getSubjectColorName(sch.subjects, slot.subjectId)) : null;

                                                    return (
                                                        <td key={period.id} colSpan={colSpan} onClick={() => handleCellClick(sch, day, period.id, slotBranch)} className="border-r border-b border-gray-200 dark:border-slate-700 p-2 cursor-pointer group/cell">
                                                            <div className={`h-28 w-full rounded-[2rem] p-4 flex flex-col justify-between transition-all duration-300 border-2 ${slot ? `${colorClasses?.bg} ${colorClasses?.border} shadow-sm hover:scale-[1.02]` : 'bg-white dark:bg-slate-900/40 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                                                                {slot ? (
                                                                    <>
                                                                        <div className="font-black text-[12px] leading-tight dark:text-white line-clamp-2 tracking-tight">{sch.subjects.find(s => s.id === slot.subjectId)?.name}</div>
                                                                        <div className="flex items-center justify-between mt-auto">
                                                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 truncate max-w-[80px]">{slot.facultyIds.map(fid => sch.faculties.find(f => f.id === fid)?.initials).join(', ')}</span>
                                                                            {conflict && <AlertTriangle size={12} className="text-red-500 animate-pulse shrink-0" />}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                                      <div className="h-8 w-8 bg-gray-200 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary-500"><Plus size={18} strokeWidth={3} /></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="border-b border-gray-200 dark:border-slate-700 bg-gray-50/10 dark:bg-slate-900/10"></td>
                                            </tr>
                                        );
                                      });
                                    })}
                                </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="max-w-4xl mx-auto w-full">
                  <FacultyTable stats={facultyStats} />
                </div>
            </div>
        </div>
        {editingCell && (
            <ClassModal 
                data={tempSlot} 
                schedule={localSchedules.find(s => s.id === editingCell.scheduleId)!} 
                day={editingCell.day} 
                onClose={() => setEditingCell(null)} 
                onSave={handleSaveSlot} 
                onDelete={() => handleSaveSlot({ subjectId: '' })}
                onCheckConflict={fid => checkConflict(editingCell.scheduleId, editingCell.day, editingCell.periodId, fid, editingCell.branch)}
            />
        )}
        {editingPeriod && (
            <PeriodModal 
                period={editingPeriod} 
                onSave={handleSavePeriod}
                onDelete={(id) => {
                  setLocalSchedules(prev => prev.map(s => ({
                      ...s,
                      periods: s.periods.filter(p => p.id !== id),
                      timeSlots: s.timeSlots.filter(ts => ts.period !== id)
                  })));
                  setEditingPeriod(null);
                }}
                onClose={() => setEditingPeriod(null)}
            />
        )}
    </div>
  );
};
