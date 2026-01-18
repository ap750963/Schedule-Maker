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
  const styles: Record<string, { bg: string, border: string, text: string, lightText: string, pill: string }> = {
    rose: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-900', lightText: 'text-rose-700', pill: 'bg-rose-200 text-rose-800' },
    orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900', lightText: 'text-orange-700', pill: 'bg-orange-200 text-orange-800' },
    amber: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', lightText: 'text-amber-700', pill: 'bg-amber-200 text-amber-800' },
    yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', lightText: 'text-yellow-700', pill: 'bg-yellow-200 text-yellow-800' },
    lime: { bg: 'bg-lime-100', border: 'border-lime-300', text: 'text-lime-900', lightText: 'text-lime-700', pill: 'bg-lime-200 text-lime-800' },
    green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', lightText: 'text-green-700', pill: 'bg-green-200 text-green-800' },
    emerald: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900', lightText: 'text-emerald-700', pill: 'bg-emerald-200 text-emerald-800' },
    teal: { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900', lightText: 'text-teal-700', pill: 'bg-teal-200 text-teal-800' },
    cyan: { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-900', lightText: 'text-cyan-700', pill: 'bg-cyan-200 text-cyan-800' },
    sky: { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-900', lightText: 'text-sky-700', pill: 'bg-sky-200 text-sky-800' },
    blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', lightText: 'text-blue-700', pill: 'bg-blue-200 text-blue-800' },
    indigo: { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900', lightText: 'text-indigo-700', pill: 'bg-indigo-200 text-indigo-800' },
    violet: { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-900', lightText: 'text-violet-700', pill: 'bg-violet-200 text-violet-800' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', lightText: 'text-purple-700', pill: 'bg-purple-200 text-purple-800' },
    fuchsia: { bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-900', lightText: 'text-fuchsia-700', pill: 'bg-fuchsia-200 text-fuchsia-800' },
    pink: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900', lightText: 'text-pink-700', pill: 'bg-pink-200 text-pink-800' },
    slate: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-900', lightText: 'text-slate-700', pill: 'bg-slate-200 text-slate-800' },
    gray: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-900', lightText: 'text-gray-700', pill: 'bg-gray-200 text-gray-800' },
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
