
import React, { useState, useMemo } from 'react';
// Added Users to the imports from lucide-react
import { ArrowLeft, Download, User, Users, Calendar, BookOpen, AlertTriangle } from 'lucide-react';
import { Schedule, DAYS, Period, TimeSlot, Faculty } from '../types';
import { Button } from '../components/ui/Button';
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm relative flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600"/>
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none">Faculty Timetables</h1>
            <p className="text-xs font-medium text-gray-500 mt-1">Automatic workload distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <Button onClick={handleExport} variant="secondary" icon={<Download size={18} />} disabled={isExporting || !selectedFacultyId} size="sm">
            <span>{isExporting ? '...' : 'Export PDF'}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Faculty Selector Card */}
          <div className="bg-white rounded-3xl shadow-soft p-6 border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 shrink-0">
              <User size={32} />
            </div>
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Select Faculty Member</label>
              <select 
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 font-bold text-gray-900 outline-none focus:border-primary-500 transition-all"
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
              >
                {allFaculties.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.initials})</option>
                ))}
              </select>
            </div>
            {selectedFaculty && (
              <div className="bg-primary-50 px-6 py-3 rounded-2xl border border-primary-100 shrink-0 text-center sm:text-left">
                <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest block">Weekly Load</span>
                <span className="text-2xl font-black text-primary-700">
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
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <Users size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold">Please add faculties and schedules first.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-card border border-gray-200 overflow-x-auto">
              <div id="faculty-timetable-grid" className="min-w-max p-6 bg-white">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-r border-gray-100 bg-gray-50/50 rounded-tl-2xl w-24">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time / Day</span>
                      </th>
                      {DAYS.map(day => (
                        <th key={day} className="p-4 border-b border-r border-gray-100 bg-gray-50/50 min-w-[160px]">
                          <span className="text-sm font-black text-gray-700 uppercase tracking-widest">{day}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {masterPeriods.map((period, pIdx) => (
                      <tr key={period.id}>
                        <td className="p-4 border-b border-r border-gray-100 bg-gray-50/30 text-center">
                          {period.isBreak ? (
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Recess</span>
                          ) : (
                            <span className="text-xs font-bold text-gray-500 font-mono">{period.time}</span>
                          )}
                        </td>
                        {DAYS.map(day => {
                          if (period.isBreak) return <td key={day} className="border-b border-r border-gray-100 bg-gray-50/20"></td>;
                          
                          const matches = facultySlots[day]?.[period.id] || [];
                          const hasConflict = matches.length > 1;

                          return (
                            <td key={day} className="p-2 border-b border-r border-gray-100 align-top">
                              {matches.map(({ slot, schedule }, mIdx) => {
                                const subject = schedule.subjects.find(s => s.id === slot.subjectId);
                                const colorName = getSubjectColorName(schedule.subjects, slot.subjectId);
                                const styles = getColorClasses(colorName);
                                
                                return (
                                  <div 
                                    key={slot.id} 
                                    className={`
                                      p-3 rounded-2xl mb-2 last:mb-0 transition-all border
                                      ${styles.bg} ${styles.border}
                                      ${hasConflict ? 'ring-2 ring-red-500 ring-offset-1' : ''}
                                    `}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${styles.pill}`}>
                                        {schedule.details.semester} Sem
                                      </span>
                                      {hasConflict && <AlertTriangle size={12} className="text-red-500" />}
                                    </div>
                                    <div className={`font-bold text-sm leading-tight line-clamp-2 ${styles.text}`}>
                                      {subject?.name}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-black/5">
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
                              {matches.length === 0 && (
                                <div className="h-20 flex items-center justify-center opacity-10">
                                  <div className="h-1 w-4 bg-gray-300 rounded-full" />
                                </div>
                              )}
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
