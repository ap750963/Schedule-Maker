export interface Subject {
  id: string;
  name: string;
  code: string;
  paperCode: string;
  theoryCount: number;
  practicalCount: number;
  color?: string; // New property for color coding
}

export interface Faculty {
  id: string;
  name: string;
  initials: string;
}

export interface ClassDetails {
  className: string; // e.g., "Computer Engineering"
  section: string;   // e.g., "A"
  session: string;   // e.g., "Fall 2024"
  semester: string;  // e.g., "3rd", "5th"
}

export interface Period {
  id: number;
  label: string;
  time: string;
  isBreak?: boolean;
}

export interface TimeSlot {
  id: string;
  day: string; // 'Monday', 'Tuesday', etc.
  period: number; // 1, 2, 3... matches Period.id
  startTime: string; // Display purposes
  subjectId: string;
  facultyIds: string[]; 
  type: 'Theory' | 'Practical';
  duration?: number; // Defaults to 1
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

export type ViewState = 'dashboard' | 'wizard' | 'editor' | 'master-editor';

// Days of the week for the grid - Added Sat
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Available colors for subjects
export const SUBJECT_COLORS = [
  'rose', 'orange', 'amber', 'yellow', 'lime', 'emerald', 
  'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'fuchsia', 'pink', 'slate'
];

// Default Periods Configuration
export const DEFAULT_PERIODS: Period[] = [
  { id: 1, label: 'Hour 1', time: '10:30 - 11:30' },
  { id: 2, label: 'Hour 2', time: '11:30 - 12:30' },
  { id: 3, label: 'Recess', time: '12:30 - 01:00', isBreak: true },
  { id: 4, label: 'Hour 3', time: '01:00 - 02:00' },
  { id: 5, label: 'Hour 4', time: '02:00 - 03:00' },
  { id: 6, label: 'Hour 5', time: '03:15 - 04:15' },
  { id: 7, label: 'Hour 6', time: '04:15 - 05:15' },
];