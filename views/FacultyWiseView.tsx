
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Download, User, Users, Calendar, AlertTriangle, FileSpreadsheet, Coffee } from 'lucide-react';
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

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm relative flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300"/>
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">Faculty Timetables</h1>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1">Unified workload distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <Button onClick={handleExportExcel} variant="secondary" icon={<FileSpreadsheet size={18} />} disabled={!selectedFacultyId} size="sm" className="rounded-xl">
            <span>Excel</span>
          </Button>
          <Button onClick={handleExport} variant="secondary" icon={<Download size={18} />} disabled={isExporting || !selectedFacultyId} size="sm" className="rounded-xl">
            <span>{isExporting ? '...' : 'PDF'}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6 border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-6 relative z-30">
            <div className="h-16 w-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 shadow-sm">
              <User size={32} />
            </div>
            <div className="flex-1 w-full relative">
              <CustomSelect
                  label="Select Faculty Member"
                  value={selectedFacultyId}
                  onChange={setSelectedFacultyId}
                  options={facultyOptions}
                  dropdownMode="absolute"
              />
            </div>
            {selectedFaculty && (
              <div className="bg-primary-50 dark:bg-primary-900/20 px-6 py-3 rounded-2xl border border-primary-100 dark:border-primary-900/40 shrink-0 text-center sm:text-left">
                <span className="text-[10px] font-black text-primary-400 dark:text-primary-300 uppercase tracking-widest block">Weekly Load</span>
                <span className="text-2xl font-black text-primary-700 dark:text-primary-100">
                  {Object.values(facultySlots).reduce((acc, day) => 
                    acc + Object.values(day).reduce((dAcc, slots) => 
                      dAcc + slots.reduce((sAcc, {slot}) => sAcc + (slot.duration || 1), 0)
                    , 0)
                  , 0)} Hours
                </span>
              </div>
            )}
          </div>

          {!selectedFacultyId ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-gray-300 dark:border-slate-700">
              <Users size={48} className="mx-auto text-gray-200 dark:text-slate-600 mb-4" />
              <p className="text-gray-400 dark:text-slate-500 font-bold">Please select a faculty member to view their schedule.</p>
            </div>
          ) : (
            <div id="faculty-timetable-grid" className="w-full overflow-auto bg-white/50 dark:bg-slate-900/20 p-2 sm:p-5 rounded-[2.5rem] no-scrollbar border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <div 
                className="grid gap-2 sm:gap-3 min-w-max"
                style={{
                  gridTemplateColumns: `minmax(50px, 60px) repeat(${masterPeriods.length}, minmax(180px, 1fr))`
                }}
              >
                <div className="sticky left-0 top-0 z-[45] bg-transparent rounded-xl"></div>
                {masterPeriods.map(p => (
                   <div 
                     key={`${p.label}_${p.time}`} 
                     className="sticky top-0 z-[40] flex flex-col items-center justify-center pt-2 pb-3 bg-gray-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800"
                   >
                      {p.isBreak ? (
                          <div className="flex flex-col items-center opacity-30">
                             <Coffee size={12} className="mb-1 text-gray-400 dark:text-slate-400" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 text-[8px]">Break</span>
                          </div>
                      ) : (
                          <>
                            <span className="text-xs font-black font-mono opacity-80 leading-none">
                                {p.time.split('-')[0].trim()}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 leading-none mt-1">
                                 - {p.time.split('-')[1].trim()}
                            </span>
                          </>
                      )}
                   </div>
                ))}

                {DAYS.map((day, dIdx) => (
                  <React.Fragment key={day}>
                    <div className="sticky left-0 z-[35] bg-white dark:bg-slate-900 rounded-[1.25rem] shadow-sm border border-gray-200 dark:border-slate-700/80 flex items-center justify-center h-16 sm:h-20 w-12 sm:w-14">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] -rotate-90">{day}</span>
                    </div>

                    {masterPeriods.map(period => {
                      if (period.isBreak) {
                        if (dIdx === 0) {
                          return (
                            <div 
                              key={period.id} 
                              style={{ gridRow: `2 / span ${DAYS.length}`, gridColumn: masterPeriods.indexOf(period) + 2 }}
                              className="rounded-[1.5rem] sm:rounded-[2rem] bg-gray-100/50 dark:bg-slate-800/20 border-2 border-dashed border-gray-200 dark:border-slate-700/50 flex flex-col items-center justify-center opacity-40"
                            >
                              <div className="flex flex-col items-center justify-center leading-none py-4">
                                  {"RECESS".split("").map((letter, i) => (
                                      <span key={i} className="text-sm font-black text-gray-400 dark:text-slate-400/80 my-0.5 drop-shadow-sm">{letter}</span>
                                  ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }

                      const matches = facultySlots[day]?.[period.id] || [];
                      const hasConflict = matches.length > 1;

                      return (
                        <div key={period.id} className="h-16 sm:h-20 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
                          {matches.length === 0 ? (
                            <div className="h-full rounded-[1.25rem] border-2 border-dashed border-gray-100 dark:border-slate-800 opacity-20" />
                          ) : (
                            matches.map(({ slot, schedule }) => {
                              const subject = schedule.subjects.find(s => s.id === slot.subjectId);
                              const colorName = getSubjectColorName(schedule.subjects, slot.subjectId, slot.facultyIds);
                              const styles = getColorClasses(colorName);
                              
                              return (
                                <div 
                                  key={slot.id} 
                                  className={`
                                    min-h-full rounded-[1.25rem] p-2 transition-all border shadow-sm relative overflow-hidden flex flex-col justify-between
                                    ${styles.bg} ${styles.border} ${styles.hover}
                                    ${hasConflict ? 'ring-4 ring-rose-500 ring-offset-1 z-10' : ''}
                                  `}
                                >
                                  <div>
                                    <div className="flex justify-between items-start mb-0.5">
                                      <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${styles.pill}`}>
                                        {schedule.details.semester} Sem
                                      </span>
                                      {hasConflict && <AlertTriangle size={8} className="text-rose-600 animate-pulse" />}
                                    </div>
                                    <div className={`font-black text-[10px] sm:text-[11px] leading-tight line-clamp-1 ${styles.text}`}>
                                      {subject?.name}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t border-black/5 dark:border-white/5">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={8} className={styles.lightText} />
                                      <span className={`text-[8px] font-black ${styles.lightText} uppercase truncate max-w-[90px]`}>
                                        {schedule.details.className}
                                      </span>
                                    </div>
                                    {slot.type === 'Practical' && (
                                      <span className={`text-[7px] font-black uppercase ${styles.lightText}`}>Lab</span>
                                    )}
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
          )}
        </div>
      </div>
    </div>
  );
};
