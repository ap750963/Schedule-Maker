export interface Subject {
  id: string;
  name: string;
  code: string;
  paperCode: string;
  theoryCount: number;
  practicalCount: number;
  color?: string;
}

export interface Faculty {
  id: string;
  name: string;
  initials: string;
}

export interface ClassDetails {
  className: string;
  section: string;
  session: string;
  semester: string;
}

export interface Period {
  id: number;
  label: string;
  time: string;
  isBreak?: boolean;
}

export interface TimeSlot {
  id: string;
  day: string;
  period: number;
  startTime: string;
  subjectId: string;
  facultyIds: string[]; 
  type: 'Theory' | 'Practical' | 'Busy';
  duration?: number;
  externalDetails?: {
    dept: string;
    semester: string;
    subject: string;
  };
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

export type ViewState = 'dashboard' | 'wizard' | 'editor' | 'master-editor' | 'faculty-wise';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SUBJECT_COLORS = [
  'rose', 'orange', 'amber', 'yellow', 'lime', 'emerald', 
  'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'fuchsia', 'pink', 'slate'
];

export const DEFAULT_PERIODS: Period[] = [
  { id: 1, label: 'Hour 1', time: '10:30 - 11:30' },
  { id: 2, label: 'Hour 2', time: '11:30 - 12:30' },
  { id: 3, label: 'Recess', time: '12:30 - 01:00', isBreak: true },
  { id: 4, label: 'Hour 3', time: '01:00 - 02:00' },
  { id: 5, label: 'Hour 4', time: '02:00 - 03:00' },
  { id: 6, label: 'Hour 5', time: '03:15 - 04:15' },
  { id: 7, label: 'Hour 6', time: '04:15 - 05:15' },
];