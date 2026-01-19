import React, { useState, useMemo } from 'react';
import { ArrowLeft, Download, User, Users, Calendar, BookOpen, AlertTriangle } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, Faculty } from '../types';
import { Button } from '../components/ui/Button';
import { CustomSelect } from '../components/ui/CustomSelect';
import { exportToPDF } from '../utils/pdf';
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

  // Extract all periods from the first schedule (assuming they share a master structure)
  const masterPeriods = schedules[0]?.periods || [];

  // Group slots by Day and Period for the selected faculty
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

  const facultyOptions = allFaculties.map(f => ({
      value: f.id,
      label: `${f.name} (${f.initials})`
  }));

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
      {/* Ambient Background Blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between shrink-0 z-50 flex-wrap gap-4 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm border-b border-white/20 dark:border-slate-800/50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-12 w-12 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full shadow-soft flex items-center justify-center text-gray-500 dark:text-slate-300 hover:text-primary-600 hover:scale-110 transition-all border border-white/50 dark:border-slate-700/50">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">Faculty Timetables</h1>
            <p className="text-sm font-bold text-gray-500 dark:text-slate-400 mt-1">Workload Distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <Button onClick={handleExport} variant="secondary" icon={<Download size={18} />} disabled={isExporting || !selectedFacultyId} size="sm" className="rounded-2xl border-white/50 bg-white/50 backdrop-blur-sm hover:bg-white/80">
            <span>{isExporting ? '...' : 'Export PDF'}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8 relative z-10 scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Faculty Selector Card */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2.5rem] shadow-card p-6 border border-white/20 dark:border-slate-700/30 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 shadow-sm">
              <User size={32} />
            </div>
            <div className="flex-1 w-full">
              <CustomSelect
                  label="Select Faculty Member"
                  value={selectedFacultyId}
                  onChange={setSelectedFacultyId}
                  options={facultyOptions}
                  dropdownMode="relative"
              />
            </div>
            {selectedFaculty && (
              <div className="bg-primary-50 dark:bg-primary-900/20 px-6 py-4 rounded-[1.5rem] border border-primary-100 dark:border-primary-900/40 shrink-0 text-center sm:text-left mt-4 sm:mt-0 shadow-sm">
                <span className="text-[10px] font-black text-primary-400 dark:text-primary-300 uppercase tracking-widest block mb-1">Weekly Load</span>
                <span className="text-3xl font-black text-primary-700 dark:text-primary-100">
                  {Object.values(facultySlots).reduce((acc, day) => 
                    acc + Object.values(day).reduce((dAcc, slots) => 
                      dAcc + slots.reduce((sAcc, {slot}) => sAcc + (slot.duration || 1), 0)
                    , 0)
                  , 0)} <span className="text-lg">Hours</span>
                </span>
              </div>
            )}
          </div>

          {/* Timetable Grid */}
          {!selectedFacultyId ? (
            <div className="text-center py-20 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-gray-300 dark:border-slate-700">
              <Users size={48} className="mx-auto text-gray-200 dark:text-slate-600 mb-4" />
              <p className="text-gray-400 dark:text-slate-500 font-bold text-lg">Select a faculty member to view schedule</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-6">
              <div id="faculty-timetable-grid" className="min-w-max">
                <table className="w-full border-separate border-spacing-2">
                  <thead className="sticky top-0 z-40">
                    <tr>
                      <th className="sticky left-0 z-50 w-24 p-0 align-bottom">
                         <div className="h-14 mb-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border border-white/20 dark:border-slate-700/30 flex items-center justify-center shadow-sm">
                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Time</span>
                         </div>
                      </th>
                      {DAYS.map(day => (
                        <th key={day} className="p-0 align-bottom min-w-[12rem]">
                           <div className="h-14 mb-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border border-white/20 dark:border-slate-700/30 flex items-center justify-center shadow-sm">
                              <span className="text-[10px] font-black text-gray-700 dark:text-slate-200 uppercase tracking-widest">{day}</span>
                           </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {masterPeriods.map((period, pIdx) => (
                      <tr key={period.id}>
                        <td className="sticky left-0 z-40 p-0 align-top">
                           <div className="w-24 min-h-[6rem] bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-[1.5rem] flex flex-col items-center justify-center shadow-sm h-full">
                              {period.isBreak ? (
                                <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest rotate-[-15deg]">Recess</span>
                              ) : (
                                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 font-mono">{period.time}</span>
                              )}
                           </div>
                        </td>
                        {DAYS.map(day => {
                          if (period.isBreak) return (
                              <td key={day} className="p-0">
                                  <div className="h-full w-full min-h-[6rem] bg-gray-50/20 dark:bg-slate-800/20 rounded-[1.5rem] flex items-center justify-center">
                                      <span className="text-2xl font-black text-gray-100 dark:text-slate-800 select-none">•</span>
                                  </div>
                              </td>
                          );
                          
                          const matches = facultySlots[day]?.[period.id] || [];
                          const hasConflict = matches.length > 1;

                          return (
                            <td key={day} className="p-0 align-top">
                              <div className="flex flex-col gap-2 h-full min-h-[6rem]">
                                {matches.length > 0 ? matches.map(({ slot, schedule }, mIdx) => {
                                    const subject = schedule.subjects.find(s => s.id === slot.subjectId);
                                    const colorName = getSubjectColorName(schedule.subjects, slot.subjectId);
                                    const styles = getColorClasses(colorName);
                                    
                                    return (
                                    <div 
                                        key={slot.id} 
                                        className={`
                                        p-4 rounded-[1.5rem] transition-all border h-full relative overflow-hidden group hover:scale-[1.02] shadow-sm hover:shadow-md
                                        ${styles.bg} ${styles.border}
                                        ${hasConflict ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm ${styles.pill}`}>
                                                {schedule.details.semester} Sem
                                            </span>
                                            {hasConflict && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                                        </div>
                                        
                                        <div className={`font-black text-sm leading-tight line-clamp-2 drop-shadow-sm mb-2 ${styles.text}`}>
                                            {subject?.name}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-black/5 dark:border-white/5">
                                            <Calendar size={12} className={styles.lightText} />
                                            <span className={`text-[10px] font-bold ${styles.lightText}`}>
                                                {schedule.details.className} - {schedule.details.section}
                                            </span>
                                        </div>
                                        
                                        {slot.type === 'Practical' && (
                                            <div className="absolute top-2 right-2 opacity-10">
                                                <BookOpen size={24} />
                                            </div>
                                        )}
                                    </div>
                                    );
                                }) : (
                                    <div className="h-full min-h-[6rem] rounded-[1.5rem] bg-white/20 dark:bg-slate-800/20 border border-white/10 dark:border-slate-700/10 border-dashed flex items-center justify-center opacity-30">
                                       <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-slate-500" />
                                    </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
        <div className="h-20" />
      </div>
    </div>
  );
};