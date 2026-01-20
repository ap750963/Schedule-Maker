
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Plus, Coffee, FileSpreadsheet, AlertTriangle, Calendar, Clock, Download } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, Faculty } from '../types';
import { Button } from '../components/ui/Button';
import { generateId, getColorClasses, getSubjectColorName, checkGlobalFacultyConflict, to12Hour } from '../utils';
import { exportMasterToExcel } from '../utils/excel';
import { FacultyTable } from '../components/schedule/FacultyTable';
import { PeriodModal } from '../components/schedule/PeriodModal';
import { ClassModal } from '../components/schedule/ClassModal';

interface MultiSemesterEditorProps {
  schedules: Schedule[];
  allSchedules: Schedule[];
  onSaveAll: (updatedSchedules: Schedule[]) => void;
  onBack: () => void;
}

export const MultiSemesterEditor: React.FC<MultiSemesterEditorProps> = ({ schedules, allSchedules, onSaveAll, onBack }) => {
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(JSON.parse(JSON.stringify(schedules)));

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
        if (data.subjectId) {
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
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300 overflow-hidden font-sans text-slate-900 dark:text-white">
        {/* Modern Glass Header */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-50 shadow-sm shrink-0">
            <div className="flex items-center gap-5">
                <button onClick={onBack} className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary-500 hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-black tracking-tight leading-none">Master Schedule</h1>
                        <span className="bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-primary-500/20">Dashboard</span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
                        <Calendar size={12} /> {localSchedules[0]?.details.session || '2024-25'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                 <Button onClick={() => exportMasterToExcel(localSchedules)} variant="secondary" icon={<FileSpreadsheet size={18} />} className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-700">
                    <span className="hidden sm:inline">Export XLSX</span>
                 </Button>
                 <Button onClick={() => onSaveAll(localSchedules)} icon={<Save size={18} />} className="rounded-2xl shadow-glow">
                    <span className="hidden sm:inline">Save Changes</span>
                 </Button>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
            <div id="master-grid" className="min-w-fit space-y-8 animate-fade-in-up">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200/60 dark:border-slate-800/60">
                    <table className="w-full border-collapse">
                        <thead className="bg-slate-50/90 dark:bg-slate-800/90 sticky top-0 z-40 backdrop-blur-md">
                            <tr>
                                <th className="p-4 w-12 sticky left-0 bg-slate-50 dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] -rotate-90">Day</div>
                                </th>
                                <th className="p-4 w-24 sticky left-12 bg-slate-50 dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Context</div>
                                </th>
                                {masterPeriods.map(p => (
                                    <th 
                                      key={p.id} 
                                      onClick={() => setEditingPeriod(p)}
                                      className={`p-4 text-center min-w-[150px] cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors border-r border-b border-slate-200 dark:border-slate-700 group ${p.isBreak ? 'bg-slate-100/40 dark:bg-slate-900/40' : ''}`}
                                    >
                                        {p.isBreak ? (
                                           <div className="flex flex-col items-center opacity-30 group-hover:opacity-100 transition-all">
                                              <Coffee size={14} className="mb-1 text-slate-500 dark:text-slate-400" />
                                              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Recess</span>
                                           </div>
                                        ) : (
                                          <div className="flex flex-col items-center group-hover:scale-105 transition-all">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Clock size={10} className="text-primary-500" />
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none">{p.time.split('-')[0].trim()}</span>
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{p.time.split('-')[1].trim()}</div>
                                          </div>
                                        )}
                                    </th>
                                ))}
                                <th className="border-b border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800">
                                  <button onClick={() => setEditingPeriod({ id: 0, label: 'New', time: '09:00 AM - 10:00 AM', isBreak: false })} className="h-8 w-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-primary-500 hover:shadow-md transition-all">
                                    <Plus size={18} strokeWidth={3} />
                                  </button>
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
                                                : 'bg-slate-50/60 dark:bg-slate-800/20';

                                            const dayBlockBorder = isLastRowOfDay 
                                                ? 'border-b-4 border-slate-200 dark:border-slate-800' 
                                                : 'border-b border-slate-100 dark:border-slate-800';

                                            return (
                                            <tr key={rowKey} className={`group hover:bg-primary-500/[0.02] transition-colors ${dayBlockBg} ${dayBlockBorder}`}>
                                                {sIdx === 0 && rIdx === 0 && (
                                                    <td rowSpan={dayTotalSubrows} className={`border-r ${dayBlockBorder} bg-white dark:bg-slate-900 sticky left-0 z-30 p-0 shadow-[2px_0_10px_-5px_rgba(0,0,0,0.1)]`}>
                                                        <div className="flex flex-col items-center justify-center py-6">
                                                            <div className="h-2 w-2 rounded-full bg-primary-500 mb-4" />
                                                            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">{day}</div>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className={`border-r ${dayBlockBorder} bg-white dark:bg-slate-900 sticky left-12 z-30 p-2 text-center`}>
                                                    <div className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm truncate max-w-[70px]">
                                                        {sch.details.level === '1st-year' ? sub : `SEM ${sub}`}
                                                    </div>
                                                </td>
                                                {sch.periods.map((period, pIdx) => {
                                                    if (period.isBreak) {
                                                      if (dIdx === 0 && sIdx === 0 && rIdx === 0) {
                                                        return (
                                                          <td key={period.id} rowSpan={totalTableRows} className="border-r border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-center align-middle p-0 group">
                                                            <div className="flex flex-col items-center justify-center py-10 opacity-10 group-hover:opacity-40 transition-opacity">
                                                                {"RECESS".split("").map((letter, i) => (
                                                                    <span key={i} className="text-sm font-black text-slate-500 dark:text-slate-400 my-0.5 tracking-tighter">{letter}</span>
                                                                ))}
                                                                <Coffee size={14} className="mt-4 text-slate-400" />
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
                                                             if (!p.isBreak) { academicCount++; rowCoveredMap[rowKey].add(p.id); }
                                                             if (academicCount >= duration) break;
                                                         }
                                                    }

                                                    let conflictLabel = null;
                                                    if (slot) {
                                                        for (const fid of slot.facultyIds) {
                                                            const conflict = checkGlobalFacultyConflict(fid, day, slot, sch.periods, sch.id, schedulesForConflict);
                                                            if (conflict) { conflictLabel = `${conflict.scheduleName} | Sem ${conflict.semester}`; break; }
                                                        }
                                                    }

                                                    const colorClasses = slot ? getColorClasses(getSubjectColorName(sch.subjects, slot.subjectId, slot.facultyIds)) : null;

                                                    return (
                                                        <td key={period.id} colSpan={colSpan} onClick={() => handleCellClick(sch, day, period.id, slotBranch)} className={`border-r ${dayBlockBorder} p-1.5 cursor-pointer group/cell overflow-hidden h-14`}>
                                                            {slot ? (
                                                                <div className={`h-full w-full rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-300 border-l-4 ${colorClasses?.bg} ${colorClasses?.border} shadow-sm group-hover/cell:shadow-xl group-hover/cell:-translate-y-0.5 ${conflictLabel ? 'ring-2 ring-rose-500 ring-offset-1 scale-[0.98]' : ''}`}>
                                                                    <div className="flex justify-between items-start">
                                                                        <div className={`font-black text-[11px] leading-none truncate tracking-tight pr-1 ${colorClasses?.text}`}>
                                                                            {sch.subjects.find(s => s.id === slot.subjectId)?.name}
                                                                        </div>
                                                                        {conflictLabel && (
                                                                          <AlertTriangle size={10} className="text-rose-500 animate-pulse shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center justify-between mt-auto">
                                                                        <span className={`${colorClasses?.accentText} text-[8px] font-black opacity-80 uppercase tracking-widest`}>
                                                                            {slot.facultyIds.map(fid => sch.faculties.find(f => f.id === fid)?.initials).join(', ') || 'TBA'}
                                                                        </span>
                                                                        <span className={`${colorClasses?.accentText} text-[7px] font-black opacity-50`}>
                                                                            {slot.type === 'Practical' ? 'LAB' : 'TH'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-full w-full rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 hover:bg-primary-500/5 hover:border-primary-500/30 transition-all duration-300">
                                                                  <Plus size={14} strokeWidth={3} className="text-slate-300 group-hover/cell:text-primary-500 transition-colors" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className={`border-b ${dayBlockBorder} bg-slate-50/10 dark:bg-slate-900/10`}></td>
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

                <div className="max-w-5xl mx-auto w-full px-4 pb-20">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <div className="relative">
                        <FacultyTable stats={facultyStats} />
                    </div>
                  </div>
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
