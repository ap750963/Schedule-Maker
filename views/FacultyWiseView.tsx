import React, { useState, useMemo } from 'react';
import { ArrowLeft, Download, User, Users, Calendar, BookOpen, AlertTriangle, FileSpreadsheet } from 'lucide-react';
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
      {/* Ambient Background Blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm relative flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300"/>
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">Faculty Timetables</h1>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1">Automatic workload distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <Button onClick={handleExportExcel} variant="secondary" icon={<FileSpreadsheet size={18} />} disabled={!selectedFacultyId} size="sm">
            <span>Excel</span>
          </Button>
          <Button onClick={handleExport} variant="secondary" icon={<Download size={18} />} disabled={isExporting || !selectedFacultyId} size="sm">
            <span>{isExporting ? '...' : 'PDF'}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8 relative z-10">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Faculty Selector Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6 border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-6 relative z-30">
            <div className="h-16 w-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
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
              <div className="bg-primary-50 dark:bg-primary-900/20 px-6 py-3 rounded-2xl border border-primary-100 dark:border-primary-900/40 shrink-0 text-center sm:text-left mt-4 sm:mt-0">
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

          {/* Timetable Grid */}
          {!selectedFacultyId ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700">
              <Users size={48} className="mx-auto text-gray-200 dark:text-slate-600 mb-4" />
              <p className="text-gray-400 dark:text-slate-500 font-bold">Please add faculties and schedules first.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div id="faculty-timetable-grid" className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur-md sticky top-0 z-20">
                    <tr>
                      <th className="p-4 border-b border-r border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 sticky left-0 z-30 w-28 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Time / Day</span>
                      </th>
                      {DAYS.map(day => (
                        <th key={day} className="p-4 border-b border-r border-gray-100 dark:border-slate-700 min-w-[180px]">
                          <span className="text-sm font-black text-gray-700 dark:text-slate-200 uppercase tracking-widest">{day}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {masterPeriods.map((period, pIdx) => (
                      <tr key={period.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-4 border-r border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 sticky left-0 z-10 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          {period.isBreak ? (
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest rotate-90 my-2">Recess</span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 font-mono bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-lg">{period.time}</span>
                          )}
                        </td>
                        {DAYS.map(day => {
                          if (period.isBreak) return <td key={day} className="border-r border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-900/30"></td>;
                          
                          const matches = facultySlots[day]?.[period.id] || [];
                          const hasConflict = matches.length > 1;

                          return (
                            <td key={day} className="p-2 border-r border-gray-100 dark:border-slate-700 align-top">
                              {matches.map(({ slot, schedule }, mIdx) => {
                                const subject = schedule.subjects.find(s => s.id === slot.subjectId);
                                const colorName = getSubjectColorName(schedule.subjects, slot.subjectId);
                                const styles = getColorClasses(colorName);
                                
                                return (
                                  <div 
                                    key={slot.id} 
                                    className={`
                                      p-3 rounded-2xl mb-2 last:mb-0 transition-all border shadow-sm relative overflow-hidden
                                      ${styles.bg} ${styles.border}
                                      ${hasConflict ? 'ring-2 ring-red-500 ring-offset-1 z-10' : ''}
                                    `}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${styles.pill}`}>
                                        {schedule.details.semester} Sem
                                      </span>
                                      {hasConflict && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                                    </div>
                                    <div className={`font-bold text-sm leading-tight line-clamp-2 ${styles.text}`}>
                                      {subject?.name}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-black/5 dark:border-white/10">
                                      <Calendar size={10} className={styles.lightText} />
                                      <span className={`text-[10px] font-bold ${styles.lightText}`}>
                                        {schedule.details.className} - {schedule.details.section}
                                      </span>
                                    </div>
                                    {slot.type === 'Practical' && (
                                      <div className="mt-1 flex items-center gap-1">
                                        <BookOpen size={10} className={styles.lightText} />
                                        <span className={`text-[9px] font-black uppercase ${styles.lightText}`}>Lab Session</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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
      </div>
    </div>
  );
};