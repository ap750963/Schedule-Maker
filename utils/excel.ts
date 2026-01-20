import * as XLSX from 'xlsx';
import { Schedule, DAYS } from '../types';

export const exportScheduleToExcel = (schedule: Schedule, fileName: string = 'schedule.xlsx') => {
  const periods = schedule.periods.filter(p => !p.isBreak);
  const data: any[][] = [];

  // Header row
  const header = ['Day', ...periods.map(p => `${p.label} (${p.time})`)];
  data.push(header);

  // Data rows
  DAYS.forEach(day => {
    const row: string[] = [day];
    periods.forEach(period => {
      const slot = schedule.timeSlots.find(s => s.day === day && s.period === period.id);
      if (slot) {
        const subject = schedule.subjects.find(sub => sub.id === slot.subjectId);
        const faculties = slot.facultyIds.map(fid => 
          schedule.faculties.find(f => f.id === fid)?.initials || 'TBA'
        ).join(', ');
        row.push(`${subject?.name || 'Unknown'} (${subject?.code || '---'}) - ${faculties}`);
      } else {
        row.push('');
      }
    });
    data.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
  XLSX.writeFile(wb, fileName);
};

export const exportMasterToExcel = (schedules: Schedule[], fileName: string = 'master_schedule.xlsx') => {
  const wb = XLSX.utils.book_new();

  schedules.forEach(schedule => {
    const periods = schedule.periods.filter(p => !p.isBreak);
    const data: any[][] = [];
    
    const header = ['Day', ...periods.map(p => `${p.label} (${p.time})`)];
    data.push(header);

    DAYS.forEach(day => {
      const row: string[] = [day];
      periods.forEach(period => {
        const slot = schedule.timeSlots.find(s => s.day === day && s.period === period.id);
        if (slot) {
          const subject = schedule.subjects.find(sub => sub.id === slot.subjectId);
          const faculties = slot.facultyIds.map(fid => 
            schedule.faculties.find(f => f.id === fid)?.initials || 'TBA'
          ).join(', ');
          row.push(`${subject?.name || 'Unknown'} - ${faculties}`);
        } else {
          row.push('');
        }
      });
      data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, `Sem ${schedule.details.semester}`);
  });

  XLSX.writeFile(wb, fileName);
};

export const exportFacultyTimetableToExcel = (
  facultyName: string, 
  schedules: Schedule[], 
  facultyId: string, 
  fileName: string = 'faculty_timetable.xlsx'
) => {
  const masterPeriods = schedules[0]?.periods || [];
  const periods = masterPeriods.filter(p => !p.isBreak);
  const data: any[][] = [];

  const header = ['Day', ...periods.map(p => `${p.label} (${p.time})`)];
  data.push(header);

  DAYS.forEach(day => {
    const row: string[] = [day];
    periods.forEach(period => {
      const slots: string[] = [];
      schedules.forEach(s => {
        const match = s.timeSlots.find(ts => ts.day === day && ts.period === period.id && ts.facultyIds.includes(facultyId));
        if (match) {
          const subject = s.subjects.find(sub => sub.id === match.subjectId);
          slots.push(`Sem ${s.details.semester}: ${subject?.name || 'Unknown'}`);
        }
      });
      row.push(slots.join(' | '));
    });
    data.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'My Timetable');
  XLSX.writeFile(wb, fileName);
};