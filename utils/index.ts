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
    if (!isPM && h >= 1 && h <= 6) isPM = true;
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
 * Gets the start and end minutes for a slot, accounting for duration.
 */
export const getSlotInterval = (slot: TimeSlot, periods: Period[]) => {
    const startPeriod = periods.find(p => p.id === slot.period);
    if (!startPeriod || startPeriod.startMinutes === undefined) return null;

    const duration = slot.duration || 1;
    const startIndex = periods.findIndex(p => p.id === slot.period);
    
    let endMinutes = startPeriod.endMinutes!;
    let actualEndIdx = startIndex;
    let count = 0;
    for (let i = startIndex; i < periods.length; i++) {
        if (!periods[i].isBreak) {
            count++;
        }
        if (count > duration) break; 
        if (!periods[i].isBreak) actualEndIdx = i;
    }
    
    if (periods[actualEndIdx]) {
        endMinutes = periods[actualEndIdx].endMinutes!;
    }

    return { start: startPeriod.startMinutes, end: endMinutes };
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
  h = h ? h : 12; // the hour '0' should be '12'
  const minutes = m < 10 ? '0' + m : m;
  return `${h}:${minutes} ${ampm}`;
};

export const getColorClasses = (colorName?: string) => {
  const color = colorName || 'gray';
  const createPalette = (c: string) => ({
      // Glassmorphism: Light mode uses soft tints, Dark mode uses glowing borders
      bg: `bg-${c}-500/10 dark:bg-${c}-500/15 backdrop-blur-2xl`,
      border: `border-${c}-200 dark:border-${c}-500/50 shadow-[0_0_15px_rgba(var(--color-${c}-500),0.1)]`,
      text: `text-${c}-900 dark:text-${c}-300`,
      accentText: `text-${c}-600 dark:text-${c}-400 font-black uppercase tracking-widest text-[10px]`,
      subText: `text-${c}-800/60 dark:text-${c}-100/40 font-medium text-[11px]`,
      hover: `hover:scale-[1.04] hover:shadow-2xl hover:shadow-${c}-500/20 transition-all duration-300`,
  });
  
  const styles: Record<string, any> = {
    rose: createPalette('rose'), orange: createPalette('orange'), amber: createPalette('amber'),
    yellow: createPalette('yellow'), lime: createPalette('lime'), green: createPalette('green'),
    emerald: createPalette('emerald'), teal: createPalette('teal'), cyan: createPalette('cyan'),
    sky: createPalette('sky'), blue: createPalette('blue'), indigo: createPalette('indigo'),
    violet: createPalette('violet'), purple: createPalette('purple'), fuchsia: createPalette('fuchsia'),
    pink: createPalette('pink'), slate: createPalette('slate'), gray: createPalette('gray'),
  };
  return styles[color] || styles['gray'];
};

export const getSolidColorClasses = (colorName?: string) => {
  const c = colorName || 'gray';
  return {
    bg: `bg-${c}-50 dark:bg-${c}-900/40 backdrop-blur-2xl`,
    text: `text-${c}-900 dark:text-${c}-200`,
    accentText: `text-${c}-700 dark:text-${c}-400 font-black uppercase tracking-[0.2em] text-[10px]`,
    subtext: `text-${c}-800/50 dark:text-${c}-300/40 text-[11px] font-bold`,
    border: `border-${c}-200 dark:border-${c}-500/40`,
    hover: `hover:bg-${c}-100 dark:hover:bg-${c}-800/80 hover:scale-[1.03]`
  };
};

export const getSubjectColorName = (subjects: Subject[], subjectId: string, facultyIds?: string[]): string => {
  const subj = subjects.find(s => s.id === subjectId);
  if (subj?.color && (!facultyIds || facultyIds.length === 0)) return subj.color;
  const colorKey = subjectId + (facultyIds ? [...facultyIds].sort().join('') : '');
  let hash = 0;
  for (let i = 0; i < colorKey.length; i++) {
      hash = colorKey.charCodeAt(i) + ((hash << 5) - hash);
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