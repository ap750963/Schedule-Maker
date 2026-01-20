
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Download, User, Users, Calendar, AlertTriangle, FileSpreadsheet, Coffee, Clock, Briefcase } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, Faculty } from '../types';
import { Button } from '../components/ui/Button';
import { CustomSelect } from '../components/ui/CustomSelect';
import { exportToPDF } from '../utils/pdf';
import { exportFacultyTimetableToExcel } from '../utils/excel';
import { getColorClasses, getSubjectColorName } from '../utils';

interface FacultyWiseViewProps {
  schedules: Schedule[];
  onBack: () => void;
}

export const FacultyWiseView: React.FC<FacultyWiseViewProps> = ({ schedules, onBack }) => {
  // Aggregate all unique faculties across all schedules
  const allFaculties = useMemo(() => {
    const map = new Map<string, Faculty>();
    schedules.forEach(s => {
      s.faculties.forEach(f => {
        if (!map.has(f.id)) map.set(f.id, f);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [schedules]);

  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(allFaculties[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);

  const selectedFaculty = allFaculties.find(f => f.id === selectedFacultyId);

  const masterPeriods = useMemo(() => {
    const periodMap = new Map<string, Period>();
    schedules.forEach(s => {
      s.periods.forEach(p => {
        const key = `${p.label}_${p.time}`;
        if (!periodMap.has(key)) periodMap.set(key, p);
      });
    });
    return Array.from(periodMap.values()).sort((a, b) => a.id - b.id);
  }, [schedules]);

  const facultySlots = useMemo(() => {
    if (!selectedFacultyId) return {};
    const grid: Record<string, Record<number, { slot: TimeSlot, schedule: Schedule }[]>> = {};
    schedules.forEach(s => {
      s.timeSlots.forEach(ts => {
        if (ts.facultyIds.includes(selectedFacultyId)) {
          if (!grid[ts.day]) grid[ts.day] = {};
          if (!grid[ts.day][ts.period]) grid[ts.day][ts.period] = [];
          grid[ts.day][ts.period].push({ slot: ts, schedule: s });
        }
      });
    });
    return grid;
  }, [selectedFacultyId, schedules]);

  const handleExport = async () => {
    if (!selectedFaculty) return;
    setIsExporting(true);
    await exportToPDF('faculty-timetable-grid', `${selectedFaculty.name}_Timetable.pdf`);
    setIsExporting(false);
  };

  const handleExportExcel = () => {
    if (!selectedFaculty) return;
    exportFacultyTimetableToExcel(selectedFaculty.name, schedules, selectedFaculty.id, `${selectedFaculty.name}_Timetable.xlsx`);
  };

  const facultyOptions = allFaculties.map(f => ({
      value: f.id,
      label: `${f.name} (${f.initials})`
  }));

  const totalLoad = useMemo(() => {
    return Object.values(facultySlots).reduce((acc, day) => 
      acc + Object.values(day).reduce((dAcc, slots) => 
        dAcc + slots.reduce((sAcc, {slot}) => sAcc + (slot.duration || 1), 0)
      , 0)
    , 0);
  }, [facultySlots]);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
      {/* Background blueprint pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-50" />

      {/* Glass Navigation Header */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm relative flex-wrap gap-4">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary-500 hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">Faculty Dashboard</h1>
              <span className="bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-primary-500/20">Analysis</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <Briefcase size={12} className="text-primary-500" /> Unified Workload View
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportExcel} variant="secondary" icon={<FileSpreadsheet size={18} />} disabled={!selectedFacultyId} className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-700">
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button onClick={handleExport} variant="secondary" icon={<Download size={18} />} disabled={isExporting || !selectedFacultyId} className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-700">
            <span className="hidden sm:inline">{isExporting ? 'Generating...' : 'PDF Report'}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8 relative z-10 no-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
          {/* Enhanced Faculty Selector Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[3rem] shadow-2xl p-6 border border-white/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center gap-8 relative z-50 overflow-visible">
            <div className="h-20 w-20 bg-primary-500/10 dark:bg-primary-500/5 rounded-[2rem] flex items-center justify-center text-primary-500 shrink-0 border border-primary-500/20 shadow-inner">
              <User size={40} />
            </div>
            <div className="flex-1 w-full">
              <CustomSelect
                  label="Profile Context"
                  value={selectedFacultyId}
                  onChange={setSelectedFacultyId}
                  options={facultyOptions}
                  dropdownMode="absolute"
                  placeholder="Select a faculty member..."
              />
            </div>
            {selectedFaculty && (
              <div className="bg-primary-500 text-white px-8 py-5 rounded-[2.5rem] shadow-glow shrink-0 text-center sm:text-left transition-all hover:scale-105">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 block mb-1">Weekly Commitment</span>
                <span className="text-3xl font-black">
                  {totalLoad} <span className="text-lg opacity-70">Hrs</span>
                </span>
              </div>
            )}
          </div>

          {!selectedFacultyId ? (
            <div className="text-center py-24 bg-white/50 dark:bg-slate-900/30 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800 backdrop-blur-sm">
              <Users size={64} strokeWidth={1} className="mx-auto text-slate-200 dark:text-slate-700 mb-6" />
              <h3 className="text-xl font-black text-slate-400 dark:text-slate-600 tracking-tight">Personalized View Ready</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-2">Select a faculty member from the dropdown above to generate their timetable.</p>
            </div>
          ) : (
            <div id="faculty-timetable-grid" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200/60 dark:border-slate-800/60 animate-fade-in-up">
              <div className="overflow-x-auto no-scrollbar">
                <div 
                  className="grid gap-0 min-w-max"
                  style={{
                    gridTemplateColumns: `minmax(60px, 80px) repeat(${masterPeriods.length}, minmax(180px, 1fr))`
                  }}
                >
                  {/* Grid Header Row */}
                  <div className="sticky left-0 top-0 z-[45] bg-slate-50 dark:bg-slate-800 p-4 border-r border-b border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] -rotate-90">Day</div>
                  </div>
                  {masterPeriods.map(p => (
                    <div 
                      key={`${p.label}_${p.time}`} 
                      className={`sticky top-0 z-[40] p-4 text-center border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md ${p.isBreak ? 'bg-slate-100/40 dark:bg-slate-950/40' : ''}`}
                    >
                        {p.isBreak ? (
                            <div className="flex flex-col items-center opacity-30">
                              <Coffee size={14} className="mb-1 text-slate-500 dark:text-slate-400" />
                              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Recess</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1.5 mb-1">
                                  <Clock size={10} className="text-primary-500" />
                                  <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none">{p.time.split('-')[0].trim()}</span>
                              </div>
                              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{p.time.split('-')[1].trim()}</div>
                            </div>
                        )}
                    </div>
                  ))}

                  {/* Grid Data Rows */}
                  {DAYS.map((day, dIdx) => (
                    <React.Fragment key={day}>
                      {/* Sticky Day Label */}
                      <div className="sticky left-0 z-[35] bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-4 shadow-[2px_0_10px_-5px_rgba(0,0,0,0.1)]">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-500 mb-3" />
                          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">{day}</div>
                      </div>

                      {masterPeriods.map(period => {
                        const matches = facultySlots[day]?.[period.id] || [];
                        const hasConflict = matches.length > 1;

                        if (period.isBreak) {
                          if (dIdx === 0) {
                            return (
                              <div 
                                key={period.id} 
                                style={{ gridRow: `2 / span ${DAYS.length}`, gridColumn: masterPeriods.indexOf(period) + 2 }}
                                className="bg-slate-50/50 dark:bg-slate-950/40 text-center align-middle p-0 border-r border-slate-200 dark:border-slate-800 group"
                              >
                                <div className="flex flex-col items-center justify-center py-10 opacity-10 group-hover:opacity-40 transition-opacity h-full">
                                    {"RECESS".split("").map((letter, i) => (
                                        <span key={i} className="text-sm font-black text-slate-500 dark:text-slate-400 my-0.5 tracking-tighter">{letter}</span>
                                    ))}
                                    <Coffee size={18} className="mt-6 text-slate-400" />
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }

                        return (
                          <div key={period.id} className="p-2 border-r border-b border-slate-100 dark:border-slate-800 min-h-[5rem] flex flex-col gap-2">
                            {matches.length === 0 ? (
                              <div className="h-full w-full rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800/40 opacity-20" />
                            ) : (
                              matches.map(({ slot, schedule }) => {
                                const subject = schedule.subjects.find(s => s.id === slot.subjectId);
                                const colorName = getSubjectColorName(schedule.subjects, slot.subjectId, slot.facultyIds);
                                const styles = getColorClasses(colorName);
                                
                                return (
                                  <div 
                                    key={slot.id} 
                                    className={`
                                      flex-1 rounded-2xl p-3 transition-all border-l-4 shadow-sm relative overflow-hidden flex flex-col justify-between group
                                      ${styles.bg} ${styles.border} hover:shadow-xl hover:-translate-y-0.5
                                      ${hasConflict ? 'ring-2 ring-rose-500 ring-offset-1 z-10 animate-pulse' : ''}
                                    `}
                                  >
                                    <div>
                                      <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${styles.pill}`}>
                                          Sem {schedule.details.semester}
                                        </span>
                                        {hasConflict && (
                                          <div className="flex items-center gap-1 text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                                            <AlertTriangle size={10} />
                                            <span className="text-[8px] font-black uppercase">Conflict</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className={`font-black text-[12px] leading-tight line-clamp-2 tracking-tight ${styles.text}`}>
                                        {subject?.name}
                                      </div>
                                    </div>
                                    
                                    <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar size={10} className={`${styles.lightText} opacity-70`} />
                                        <span className={`text-[9px] font-black ${styles.lightText} uppercase truncate max-w-[100px]`}>
                                          {schedule.details.className}
                                        </span>
                                      </div>
                                      <div className={`text-[8px] font-black uppercase opacity-60 ${styles.lightText}`}>
                                        {slot.type === 'Theory' ? 'TH' : 'LAB'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Soft footer spacer */}
      <div className="h-20 shrink-0 pointer-events-none" />
    </div>
  );
};
