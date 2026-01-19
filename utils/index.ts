import { SUBJECT_COLORS, Schedule, Subject, Faculty } from '../types';

export const generateId = () => Math.random().toString(36).substring(2, 9);

// Heuristic to parse "10:30" or "01:00" (pm) to "13:00" for input
export const to24Hour = (timeStr: string) => {
    if (!timeStr) return '';
    let parts = timeStr.trim().split(':');
    if (parts.length !== 2) return '';
    let h = parseInt(parts[0]);
    let m = parseInt(parts[1]);
    if (isNaN(h) || isNaN(m)) return '';
    
    // Heuristic: if hour is 1-6, assume PM (school hours typically 8am-6pm)
    // This allows "01:00" to become "13:00"
    if (h >= 1 && h <= 6) h += 12;
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Map color names to Tailwind classes
export const getColorClasses = (colorName?: string) => {
  const color = colorName || 'gray';
  
  // Glassmorphic Playful Palette
  const createPalette = (c: string) => ({
      // Base glass background with tint
      bg: `bg-${c}-500/10 dark:bg-${c}-400/10 backdrop-blur-md`,
      // Gradient accent for active state or header
      gradient: `bg-gradient-to-br from-${c}-50 to-${c}-100/50 dark:from-${c}-900/40 dark:to-${c}-800/20`,
      // Subtle border
      border: `border-${c}-200/60 dark:border-${c}-700/60`,
      // Text colors
      text: `text-${c}-900 dark:text-${c}-100`,
      lightText: `text-${c}-700/70 dark:text-${c}-300/70`,
      // Interactive elements
      pill: `bg-${c}-500/15 text-${c}-700 dark:text-${c}-200`,
      // Hover effects
      hover: `hover:bg-${c}-500/20 dark:hover:bg-${c}-400/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-${c}-500/10`,
      // Icon colors
      icon: `text-${c}-500 dark:text-${c}-400`
  });

  const styles: Record<string, ReturnType<typeof createPalette>> = {
    rose: createPalette('rose'),
    orange: createPalette('orange'),
    amber: createPalette('amber'),
    yellow: createPalette('yellow'),
    lime: createPalette('lime'),
    green: createPalette('green'),
    emerald: createPalette('emerald'),
    teal: createPalette('teal'),
    cyan: createPalette('cyan'),
    sky: createPalette('sky'),
    blue: createPalette('blue'),
    indigo: createPalette('indigo'),
    violet: createPalette('violet'),
    purple: createPalette('purple'),
    fuchsia: createPalette('fuchsia'),
    pink: createPalette('pink'),
    slate: createPalette('slate'),
    gray: createPalette('gray'),
  };
  return styles[color] || styles['gray'];
};

export const getSubjectColorName = (subjects: Subject[], subjectId: string): string => {
  const subj = subjects.find(s => s.id === subjectId);
  if (subj?.color) return subj.color;
  
  // Hash id to pick a color if none assigned
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
      hash = subjectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
};

export const getFacultyInitials = (faculties: Faculty[], ids: string[] | undefined) => {
  if (!ids || ids.length === 0) return 'TBA';
  const initials = ids.map(id => {
      const fac = faculties.find(f => f.id === id);
      return fac?.initials || fac?.name.substring(0, 2).toUpperCase();
  });
  return initials.join(', ');
};

export const generateInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 3);
};

export const getRandomColor = () => SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];

// THEME CONFIGURATION
export interface ThemePalette {
    50: string; 100: string; 200: string; 300: string; 400: string;
    500: string; 600: string; 700: string; 800: string; 900: string;
}

export const THEMES: Record<string, ThemePalette> = {
    teal: { // Default
        50: '240 253 250', 100: '204 251 241', 200: '153 246 228', 300: '94 234 212', 400: '45 212 191',
        500: '20 184 166', 600: '13 148 136', 700: '15 118 110', 800: '17 94 89', 900: '19 78 74'
    },
    blue: {
        50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253', 400: '96 165 250',
        500: '59 130 246', 600: '37 99 235', 700: '29 78 216', 800: '30 64 175', 900: '30 58 138'
    },
    violet: {
        50: '245 243 255', 100: '237 233 254', 200: '221 214 254', 300: '196 181 253', 400: '167 139 250',
        500: '139 92 246', 600: '124 58 237', 700: '109 40 217', 800: '91 33 182', 900: '76 29 149'
    },
    rose: {
        50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175', 400: '251 113 133',
        500: '244 63 94', 600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55'
    },
    amber: {
        50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77', 400: '251 191 36',
        500: '245 158 11', 600: '217 119 6', 700: '180 83 9', 800: '146 64 14', 900: '120 53 15'
    }
};

export const applyTheme = (themeName: string) => {
    const palette = THEMES[themeName.toLowerCase()] || THEMES['teal'];
    const root = document.documentElement;
    Object.entries(palette).forEach(([shade, value]) => {
        root.style.setProperty(`--primary-${shade}`, value);
    });
};