
import { SUBJECT_COLORS, Schedule, Subject, Faculty, TimeSlot, Period } from '../types';

export const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Converts "HH:MM" string to minutes from midnight
 */
export const timeStrToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const cleanStr = timeStr.trim().toLowerCase();
    let isPM = cleanStr.includes('pm');
    const [rawH, rawM] = cleanStr.replace(/[ap]m/, '').split(':').map(n => parseInt(n));
    let h = rawH;
    let m = rawM || 0;
    
    // Auto-detect PM for typical college hours if not specified
    if (!cleanStr.includes('am') && !cleanStr.includes('pm')) {
      if (h >= 1 && h <= 6) isPM = true;
    }
    
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + m;
};

/**
 * Core Overlap Logic: Max(S1, S2) < Min(E1, E2)
 */
export const isTimeOverlap = (s1: number, e1: number, s2: number, e2: number): boolean => {
    return Math.max(s1, s2) < Math.min(e1, e2);
};

/**
 * Gets the start and end minutes for a slot, accounting for duration and the specific schedule's period config.
 */
export const getSlotInterval = (slot: Partial<TimeSlot>, periods: Period[]) => {
    if (!slot.period) return null;
    const startPeriod = periods.find(p => p.id === slot.period);
    if (!startPeriod) return null;

    const startIndex = periods.findIndex(p => p.id === slot.period);
    const duration = slot.duration || 1;
    
    // Start time is fixed by the period
    const startMinutes = startPeriod.startMinutes !== undefined 
        ? startPeriod.startMinutes 
        : timeStrToMinutes(startPeriod.time.split('-')[0]);

    // Calculate end time by jumping 'duration' academic (non-break) periods
    let actualEndIdx = startIndex;
    let academicCount = 0;
    for (let i = startIndex; i < periods.length; i++) {
        if (!periods[i].isBreak) {
            academicCount++;
        }
        actualEndIdx = i;
        if (academicCount >= duration) break;
    }
    
    const endPeriod = periods[actualEndIdx];
    const endMinutes = endPeriod.endMinutes !== undefined 
        ? endPeriod.endMinutes 
        : timeStrToMinutes(endPeriod.time.split('-')[1]);

    return { start: startMinutes, end: endMinutes };
};

/**
 * GLOBAL FACULTY CONFLICT CHECKER
 * Checks if a faculty member is scheduled in ANY other class at the same time across ALL schedules.
 */
export interface ConflictInfo {
  scheduleName: string;
  semester: string;
  subjectName: string;
  type: string;
}

export const checkGlobalFacultyConflict = (
  facultyId: string,
  day: string,
  targetSlot: Partial<TimeSlot>,
  targetPeriods: Period[],
  currentScheduleId: string,
  allSchedules: Schedule[]
): ConflictInfo | null => {
  const targetInterval = getSlotInterval(targetSlot, targetPeriods);
  if (!targetInterval) return null;

  for (const schedule of allSchedules) {
    // We check all schedules in the same session
    // Note: We don't skip currentScheduleId because we need to check internal overlaps with OTHER slots
    
    const schedulePeriods = schedule.periods && schedule.periods.length > 0 ? schedule.periods : [];
    if (schedulePeriods.length === 0) continue;

    for (const slot of schedule.timeSlots) {
      // Basic match conditions
      if (slot.day !== day) continue;
      if (!slot.facultyIds.includes(facultyId)) continue;
      
      // Prevent self-conflict with the exact same slot being edited
      if (schedule.id === currentScheduleId && slot.id === targetSlot.id) continue;

      const slotInterval = getSlotInterval(slot, schedulePeriods);
      if (!slotInterval) continue;

      if (isTimeOverlap(targetInterval.start, targetInterval.end, slotInterval.start, slotInterval.end)) {
        const subject = schedule.subjects.find(s => s.id === slot.subjectId);
        return {
          scheduleName: schedule.details.className,
          semester: schedule.details.semester,
          subjectName: subject?.name || 'Unknown',
          type: slot.type
        };
      }
    }
  }

  return null;
};

export const to24Hour = (timeStr: string) => {
    if (!timeStr) return '';
    const mins = timeStrToMinutes(timeStr);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const to12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  const minutes = m < 10 ? '0' + m : m;
  return `${h}:${minutes} ${ampm}`;
};

export const getColorClasses = (colorName?: string) => {
  const color = colorName || 'slate';
  const createPalette = (c: string) => ({
      bg: `bg-${c}-300/80 dark:bg-${c}-500/20 backdrop-blur-md`,
      border: `border-${c}-500/40 dark:border-${c}-400/30 shadow-[0_8px_24px_-4px_rgba(var(--color-${c}-500),0.25)]`,
      text: `text-${c}-950 dark:text-${c}-50`,
      accentText: `text-${c}-950 dark:text-${c}-200 font-black uppercase tracking-widest text-[10px]`,
      subText: `text-${c}-900/70 dark:text-${c}-100/50 font-bold text-[11px]`,
      hover: `hover:scale-[1.04] hover:shadow-2xl hover:bg-${c}-400/90 dark:hover:bg-${c}-500/40 transition-all duration-300`,
      pill: `bg-${c}-500/20 dark:bg-${c}-500/40 text-${c}-700 dark:text-${c}-300`,
      lightText: `text-${c}-700 dark:text-${c}-400`
  });
  
  const styles: Record<string, any> = {};
  SUBJECT_COLORS.forEach(c => {
    styles[c] = createPalette(c);
  });
  
  styles['gray'] = createPalette('slate');
  return styles[color] || styles['gray'];
};

export const getSolidColorClasses = (colorName?: string) => {
  const c = colorName || 'slate';
  return {
    bg: `bg-${c}-300 dark:bg-${c}-900/80 backdrop-blur-xl`,
    text: `text-${c}-950 dark:text-${c}-50`,
    accentText: `text-${c}-950 dark:text-${c}-200 font-black uppercase tracking-[0.2em] text-[10px]`,
    subtext: `text-${c}-900/70 dark:text-${c}-200/60 text-[11px] font-bold`,
    border: `border-${c}-500/50 dark:border-${c}-400/40`,
    hover: `hover:bg-${c}-400 dark:hover:bg-${c}-700 hover:scale-[1.04] hover:shadow-2xl transition-all duration-300`
  };
};

export const getSubjectColorName = (subjects: Subject[], subjectId: string, facultyIds?: string[]): string => {
  const subj = subjects.find(s => s.id === subjectId);
  if (!subj) return 'slate';

  const facKey = facultyIds ? [...facultyIds].sort().join('-') : 'no-faculty';
  const compositeKey = `${subjectId}_${facKey}`;

  let hash = 0;
  for (let i = 0; i < compositeKey.length; i++) {
    hash = compositeKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
};

export const getFacultyInitials = (faculties: Faculty[], ids: string[] | undefined) => {
  if (!ids || ids.length === 0) return 'TBA';
  return ids.map(id => faculties.find(f => f.id === id)?.initials || '??').join(', ');
};

export const generateInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 3);
};

export const getRandomColor = () => SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];

export const applyTheme = (themeName: string) => {
    const palette = (THEMES as any)[themeName.toLowerCase()] || (THEMES as any)['teal'];
    const root = document.documentElement;
    Object.entries(palette).forEach(([shade, value]) => {
        root.style.setProperty(`--primary-${shade}`, value as string);
    });
};

export const THEMES = {
    teal: { 50: '236 253 250', 100: '204 251 241', 200: '153 246 228', 300: '94 234 212', 400: '45 212 191', 500: '20 184 166', 600: '13 148 136', 700: '15 118 110', 800: '17 94 89', 900: '19 78 74' },
    blue: { 50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253', 400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '29 78 216', 800: '30 64 175', 900: '30 58 138' },
    violet: { 50: '245 243 255', 100: '237 233 254', 200: '221 214 254', 300: '196 181 253', 400: '167 139 250', 500: '139 92 246', 600: '124 58 237', 700: '109 40 217', 800: '91 33 182', 900: '76 29 149' },
    rose: { 50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175', 400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55' },
    amber: { 50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77', 400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 700: '180 83 9', 800: '146 64 14', 900: '120 53 15' }
};
