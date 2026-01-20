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
    
    // Find the end time by looking at the period where the slot ends
    // If it spans 2 periods, the end time is the endMinutes of (startIndex + 1)
    let endMinutes = startPeriod.endMinutes!;
    
    // Handle duration by finding the actual end time across consecutive periods
    let actualEndIdx = startIndex;
    let count = 0;
    // Iterate to find the end period index based on academic duration (skipping breaks if needed logic required, but simplified here)
    for (let i = startIndex; i < periods.length; i++) {
        if (!periods[i].isBreak) {
            count++;
        }
        if (count > duration) break; 
        // We track the index of the last valid period included
        if (!periods[i].isBreak) actualEndIdx = i;
    }
    
    // If we have periods, grab end minutes of the calculated end index
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

export const getColorClasses = (colorName?: string) => {
  const color = colorName || 'gray';
  const createPalette = (c: string) => ({
      bg: `bg-${c}-500/10 dark:bg-${c}-400/20 backdrop-blur-md`,
      gradient: `bg-gradient-to-br from-${c}-50 to-${c}-100/50 dark:from-${c}-900/60 dark:to-${c}-800/40`,
      border: `border-${c}-200/60 dark:border-${c}-500/40`,
      text: `text-${c}-900 dark:text-${c}-50`,
      lightText: `text-${c}-700/70 dark:text-${c}-300/80`,
      pill: `bg-${c}-500/15 text-${c}-700 dark:text-${c}-200`,
      hover: `hover:bg-${c}-500/20 dark:hover:bg-${c}-400/30 hover:scale-[1.02] hover:shadow-lg hover:shadow-${c}-500/10`,
      icon: `text-${c}-500 dark:text-${c}-400`
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
    bg: `bg-${c}-200 dark:bg-${c}-900/40`,
    text: `text-${c}-900 dark:text-${c}-50`,
    subtext: `text-${c}-700 dark:text-${c}-300`,
    border: `border-${c}-300 dark:border-${c}-500/40`,
    hover: `hover:bg-${c}-300 dark:hover:bg-${c}-800/80`
  };
};

export const getSubjectColorName = (subjects: Subject[], subjectId: string): string => {
  const subj = subjects.find(s => s.id === subjectId);
  if (subj?.color) return subj.color;
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
      hash = subjectId.charCodeAt(i) + ((hash << 5) - hash);
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
    teal: { 
      // Slightly fresher/lighter teal palette
      50: '236 253 250', 
      100: '204 251 241', 
      200: '153 246 228', 
      300: '94 234 212', 
      400: '45 212 191', 
      500: '20 184 166', // Standard Teal 500
      600: '13 148 136', 
      700: '15 118 110', 
      800: '17 94 89', 
      900: '19 78 74' 
    },
    blue: { 50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253', 400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '29 78 216', 800: '30 64 175', 900: '30 58 138' },
    violet: { 50: '245 243 255', 100: '237 233 254', 200: '221 214 254', 300: '196 181 253', 400: '167 139 250', 500: '139 92 246', 600: '124 58 237', 700: '109 40 217', 800: '91 33 182', 900: '76 29 149' },
    rose: { 50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175', 400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55' },
    amber: { 50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77', 400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 700: '180 83 9', 800: '146 64 14', 900: '120 53 15' }
};