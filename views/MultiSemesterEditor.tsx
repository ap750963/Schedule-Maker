
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Plus, Coffee, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, Faculty } from '../types';
import { Button } from '../components/ui/Button';
import { generateId, getColorClasses, getSubjectColorName, checkGlobalFacultyConflict, to12Hour } from '../utils';
import { exportMasterToExcel } from '../utils/excel';
import { FacultyTable } from '../components/schedule/FacultyTable';
import { PeriodModal } from '../components/schedule/PeriodModal';
import { ClassModal } from '../components/schedule/ClassModal';

interface MultiSemesterEditorProps {
  schedules: Schedule[]; // Current active/filtered view schedules
  allSchedules: Schedule[]; // Full context for global conflict checking
  onSaveAll: (updatedSchedules: Schedule[]) => void;
  onBack: () => void;
}

export const MultiSemesterEditor: React.FC<MultiSemesterEditorProps> = ({ schedules, allSchedules, onSaveAll, onBack }) => {
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(JSON.parse(JSON.stringify(schedules)));

  // Combine local edits with global context for accurate conflict detection
  const schedulesForConflict = useMemo(() => {
    const localIds = new Set(localSchedules.map(s => s.id));
    const nonEdited = allSchedules.filter(s => !localIds.has(s.id));
    return [...localSchedules, ...nonEdited];
  }, [localSchedules, allSchedules]);

  const allFaculties = useMemo(() => {
    const map = new Map<string, Faculty>();
    localSchedules.forEach(s => {
        s.faculties.forEach(f => {
            if (!map.has(f.id)) map.set(f.id, f);
        });
    });
    return Array.from(map.values());
  }, [localSchedules]);

  const masterPeriods = localSchedules[0]?.periods || [];

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
    const time = `${to12Hour(startTime)} - ${to12Hour(endTime)}`;
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
      return DAYS.length * localSchedules.reduce((acc, curr) => acc + (curr.details.level === '1st-year' ? (curr.details.branches?.length || 1) : 1), 0);
  }, [localSchedules]);

  return (
    <div className="h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300 overflow-hidden font-sans text-slate-900 dark:text-white">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center z-50 shadow-sm relative shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="h-9 w-9 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-500 hover:text-primary-600 transition-all shadow-sm"><ArrowLeft size={18} /></button>
                <div className="flex items-baseline gap-2">
                    <h1 className="text-lg font-black leading-none tracking-tight">Master Schedule</h1>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{localSchedules[0]?.details.session || '2024-25'}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={() => exportMasterToExcel(localSchedules)} variant="secondary" icon={<FileSpreadsheet size={18} />} size="sm" className="rounded-xl w-9 h-9 !p-0" title="Export to Excel" />
                 <Button onClick={() => onSaveAll(localSchedules)} icon={<Save size={18} />} size="sm" className="rounded-xl shadow-glow w-9 h-9 !p-0" title="Save All" />
            </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-50/30 dark:bg-slate-950/30">
            <div id="master-grid" className="min-w-fit space-y-8">
                <div className="bg-white dark:bg-slate-900 shadow-soft rounded-[2.5rem] overflow-hidden border border-gray-200 dark:border-slate-800">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-100/90 dark:bg-slate-800/90 sticky top-0 z-40">
                            <tr>
                                <th className="border-r border-b border-gray-200 dark:border-slate-700 p-3 w-10 sticky left-0 bg-gray-100 dark:bg-slate-800 text-[10px] font-black uppercase text-gray-400 tracking-widest">Day</th>
                                <th className="border-r border-b border-gray-200 dark:border-slate-700 p-3 w-20 sticky left-10 bg-gray-100 dark:bg-slate-800 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Context</th>
                                {masterPeriods.map(p => (
                                    <th 
                                      key={p.id} 
                                      onClick={() => setEditingPeriod(p)}
                                      className={`border-r border-b border-gray-200 dark:border-slate-700 p-3 text-center min-w-[140px] cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors group ${p.isBreak ? 'bg-gray-100/30 dark:bg-slate-800/40' : ''}`}
                                    >
                                        {p.isBreak ? (
                                           <div className="flex flex-col items-center opacity-40">
                                              <Coffee size={12} className="mb-1 text-gray-400 dark:text-slate-400" />
                                              <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-300">Recess</span>
                                           </div>
                                        ) : (
                                          <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                                            <div className="text-[10px] font-black uppercase tracking-[0.05em] text-gray-900 dark:text-white">{p.time.split('-')[0].trim()}</div>
                                            <div className="text-[9px] font-bold uppercase tracking-[0.05em] text-gray-400 dark:text-slate-500 mt-0.5">{p.time.split('-')[1].trim()}</div>
                                          </div>
                                        )}
                                    </th>
                                ))}
                                <th className="border-b border-gray-200 dark:border-slate-700 p-2 bg-gray-100 dark:bg-slate-800">
                                  <button onClick={() => setEditingPeriod({ id: 0, label: 'New', time: '09:00 AM - 10:00 AM', isBreak: false })} className="p-2 text-gray-300 hover:text-primary-500 transition-colors"><Plus size={20} strokeWidth={3} /></button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {DAYS.map((day, dIdx) => {
                                const rowCoveredMap: Record<string, Set<number>> = {};
                                const dayTotalSubrows = localSchedules.reduce((acc, curr) => acc + (curr.details.level === '1st-year' ? (curr.details.branches?.length || 1) : 1), 0);
                                let daySubrowCounter = 0;
                                const isEvenDay = dIdx % 2 === 0;

                                return (
                                <React.Fragment key={day}>
                                    {localSchedules.map((sch, sIdx) => {
                                        const subRows = sch.details.level === '1st-year' ? (sch.details.branches || ['Batch A']) : [sch.details.semester];
                                        return subRows.map((sub, rIdx) => {
                                            const rowKey = `${sch.id}-${sub}`;
                                            if (!rowCoveredMap[rowKey]) rowCoveredMap[rowKey] = new Set();
                                            daySubrowCounter++;
                                            const isLastRowOfDay = daySubrowCounter === dayTotalSubrows;
                                            
                                            const dayBlockBg = isEvenDay 
                                                ? 'bg-white dark:bg-slate-900' 
                                                : 'bg-gray-50/40 dark:bg-slate-800/10';

                                            const dayBlockBorder = isLastRowOfDay 
                                                ? 'border-b-4 border-gray-200 dark:border-slate-700' 
                                                : 'border-b border-gray-100 dark:border-slate-800';

                                            return (
                                            <tr key={rowKey} className={`group hover:bg-primary-500/5 transition-colors ${dayBlockBg} ${dayBlockBorder}`}>
                                                {sIdx === 0 && rIdx === 0 && (
                                                    <td rowSpan={dayTotalSubrows} className={`border-r ${dayBlockBorder} bg-white dark:bg-slate-900 sticky left-0 z-30 text-center font-black text-gray-400 text-[10px] uppercase p-0 ${!isEvenDay ? '!bg-gray-100/20 dark:!bg-slate-800/20' : ''}`}>
                                                        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="mx-auto py-4 tracking-[0.5em]">{day}</div>
                                                    </td>
                                                )}
                                                <td className={`border-r ${dayBlockBorder} bg-white dark:bg-slate-900 sticky left-10 z-30 p-2 text-center shadow-sm ${!isEvenDay ? '!bg-gray-100/20 dark:!bg-slate-800/20' : ''}`}>
                                                    <div className="text-[9px] font-black text-primary-600 dark:text-primary-300 uppercase truncate max-w-[70px] tracking-tight bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-xl border border-primary-100 dark:border-primary-900/50">{sch.details.level === '1st-year' ? sub : `SEM ${sub}`}</div>
                                                </td>
                                                {sch.periods.map((period, pIdx) => {
                                                    if (period.isBreak) {
                                                      if (dIdx === 0 && sIdx === 0 && rIdx === 0) {
                                                        return (
                                                          <td key={period.id} rowSpan={totalTableRows} className="border-r border-b border-gray-200 dark:border-slate-700 bg-gray-100/50 dark:bg-slate-800/20 text-center align-middle p-0">
                                                            <div className="flex flex-col items-center justify-center leading-none py-6 opacity-40 hover:opacity-100 transition-opacity">
                                                                {"RECESS".split("").map((letter, i) => (
                                                                    <span key={i} className="text-xl sm:text-2xl font-black text-gray-400 dark:text-slate-400/80 my-1.5 drop-shadow-sm">{letter}</span>
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

                                                    // Use robust global checker with full context
                                                    let conflictLabel = null;
                                                    if (slot) {
                                                        for (const fid of slot.facultyIds) {
                                                            const conflict = checkGlobalFacultyConflict(fid, day, slot, sch.periods, sch.id, schedulesForConflict);
                                                            if (conflict) {
                                                                conflictLabel = `${conflict.scheduleName} | Sem ${conflict.semester}`;
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    const colorClasses = slot ? getColorClasses(getSubjectColorName(sch.subjects, slot.subjectId, slot.facultyIds)) : null;

                                                    return (
                                                        <td key={period.id} colSpan={colSpan} onClick={() => handleCellClick(sch, day, period.id, slotBranch)} className={`border-r ${dayBlockBorder} p-1.5 cursor-pointer group/cell overflow-hidden`}>
                                                            {slot ? (
                                                                <div className={`h-28 w-full rounded-[1.75rem] p-4 flex flex-col justify-between transition-all duration-300 border-2 ${colorClasses?.bg} ${colorClasses?.border} shadow-card ${colorClasses?.hover} ${conflictLabel ? 'ring-4 ring-rose-500 ring-offset-2 z-10 scale-[0.98] animate-pulse' : ''}`}>
                                                                    <div className="space-y-0.5">
                                                                        <div className={`font-black text-[13px] leading-tight line-clamp-2 tracking-tight ${colorClasses?.text}`}>
                                                                            {sch.subjects.find(s => s.id === slot.subjectId)?.name}
                                                                        </div>
                                                                        <div className={`text-[10px] font-bold opacity-70 ${colorClasses?.text}`}>
                                                                            {slot.type === 'Practical' ? 'Lab Session' : 'Theory Class'}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center justify-between mt-auto">
                                                                        <span className={`${colorClasses?.accentText} text-[9px] truncate max-w-[100px]`}>
                                                                            {slot.facultyIds.map(fid => sch.faculties.find(f => f.id === fid)?.initials).join(', ')}
                                                                        </span>
                                                                        {conflictLabel && (
                                                                          <div className="bg-rose-500 p-1 rounded-full shadow-lg animate-bounce">
                                                                            <AlertTriangle size={12} className="text-white" title={`Conflict: ${conflictLabel}`} />
                                                                          </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-28 w-full rounded-[1.75rem] border-2 border-dashed border-gray-200 dark:border-slate-800 flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-slate-900 transition-all">
                                                                  <div className="h-8 w-8 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-primary-500 transition-all">
                                                                    <Plus size={18} strokeWidth={3} />
                                                                  </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className={`border-b ${dayBlockBorder} bg-gray-50/10 dark:bg-slate-900/10`}></td>
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
                allSchedules={schedulesForConflict}
                day={editingCell.day} 
                onClose={() => setEditingCell(null)} 
                onSave={handleSaveSlot} 
                onDelete={() => handleSaveSlot({ subjectId: '' })}
                onCheckConflict={(fid, currentSlotData) => {
                  const conflict = checkGlobalFacultyConflict(fid, editingCell.day, currentSlotData, localSchedules.find(s => s.id === editingCell.scheduleId)!.periods, editingCell.scheduleId, schedulesForConflict);
                  return conflict ? `${conflict.scheduleName} | Sem ${conflict.semester}` : null;
                }}
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
