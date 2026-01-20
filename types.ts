export interface Subject {
  id: string;
  name: string;
  code: string;
  paperCode: string;
  theoryCount: number;
  practicalCount: number;
  color?: string;
}

export interface ExternalSlot {
  id: string;
  day: string;
  periodId: number;
  details: {
    department: string;
    semester: string;
    subject: string;
  }
}

export interface Faculty {
  id: string;
  name: string;
  initials: string;
  externalSlots?: ExternalSlot[];
}

export interface ClassDetails {
  className: string; // Department name
  section: string;
  session: string;
  semester: string;
  level: '1st-year' | 'higher-year';
  branches?: string[]; // Used for 1st-year combined schedules
}

export interface Period {
  id: number;
  label: string;
  time: string;
  isBreak?: boolean;
  startMinutes?: number; // Minutes from midnight
  endMinutes?: number;   // Minutes from midnight
}

export interface TimeSlot {
  id: string;
  day: string;
  period: number;
  startTime: string;
  subjectId: string;
  facultyIds: string[]; 
  type: 'Theory' | 'Practical';
  duration?: number;
  branch?: string; // Specific branch for 1st-year combined batch slots if needed
}

export interface Schedule {
  id: string;
  details: ClassDetails;
  subjects: Subject[];
  faculties: Faculty[];
  periods: Period[];
  timeSlots: TimeSlot[];
  lastModified: number;
}

export type ViewState = 'dashboard' | 'wizard' | 'editor' | 'master-editor' | 'master-selection' | 'faculty-wise' | 'faculty-management';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SUBJECT_COLORS = [
  'rose', 'orange', 'amber', 'yellow', 'lime', 'emerald', 
  'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'fuchsia', 'pink', 'slate'
];

export const FIRST_YEAR_PERIODS: Period[] = [
  { id: 1, label: 'Hour 1', time: '10:00 - 11:00', startMinutes: 600, endMinutes: 660 },
  { id: 2, label: 'Hour 2', time: '11:00 - 12:00', startMinutes: 660, endMinutes: 720 },
  { id: 3, label: 'Hour 3', time: '12:00 - 01:00', startMinutes: 720, endMinutes: 780 },
  { id: 4, label: 'Recess', time: '01:00 - 01:30', startMinutes: 780, endMinutes: 810, isBreak: true },
  { id: 5, label: 'Hour 4', time: '01:30 - 02:30', startMinutes: 810, endMinutes: 870 },
  { id: 6, label: 'Hour 5', time: '02:30 - 03:30', startMinutes: 870, endMinutes: 930 },
  { id: 7, label: 'Hour 6', time: '03:30 - 04:00', startMinutes: 930, endMinutes: 960 },
];

export const HIGHER_YEAR_PERIODS: Period[] = [
  { id: 1, label: 'Hour 1', time: '10:30 - 11:30', startMinutes: 630, endMinutes: 690 },
  { id: 2, label: 'Hour 2', time: '11:30 - 12:30', startMinutes: 690, endMinutes: 750 },
  { id: 3, label: 'Hour 3', time: '12:30 - 01:30', startMinutes: 750, endMinutes: 810 },
  { id: 4, label: 'Recess', time: '01:30 - 02:00', startMinutes: 810, endMinutes: 840, isBreak: true },
  { id: 5, label: 'Hour 4', time: '02:00 - 03:00', startMinutes: 840, endMinutes: 900 },
  { id: 6, label: 'Hour 5', time: '03:15 - 04:15', startMinutes: 915, endMinutes: 975 },
  { id: 7, label: 'Hour 6', time: '04:15 - 05:00', startMinutes: 975, endMinutes: 1020 },
];

export const DEFAULT_PERIODS: Period[] = HIGHER_YEAR_PERIODS;