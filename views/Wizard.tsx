import React, { useState } from 'react';
import { ChevronLeft, GraduationCap, Users, Book, Beaker, Minus, Plus, Trash2, ArrowRight, User, CalendarRange } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Subject, Faculty, Schedule, DEFAULT_PERIODS } from '../types';
import { generateId, generateInitials, getRandomColor } from '../utils';

interface WizardProps {
  onCancel: () => void;
  onFinish: (schedules: Schedule[]) => void;
}

const TOTAL_STEPS = 3;

export const Wizard: React.FC<WizardProps> = ({ onCancel, onFinish }) => {
  const [step, setStep] = useState(1);
  
  // Step 1 State: Department & Semesters
  const [deptName, setDeptName] = useState('');
  const [session, setSession] = useState('');
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);

  // Step 2 State: Subjects Map (Semester -> Subjects[])
  const [subjectsBySem, setSubjectsBySem] = useState<Record<number, Subject[]>>({});
  const [activeSemTab, setActiveSemTab] = useState<number | null>(null);

  // Step 3 State: Faculties
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  const handleNext = () => {
    if (step === 1) {
        if (selectedSemesters.length === 0) return;
        const newSubMap = { ...subjectsBySem };
        selectedSemesters.forEach(s => {
            if (!newSubMap[s]) newSubMap[s] = [];
        });
        setSubjectsBySem(newSubMap);
        setActiveSemTab(selectedSemesters[0]);
        setStep(2);
    } else if (step === 2) {
        setStep(3);
    } else {
        finishWizard();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  const finishWizard = () => {
    const newSchedules: Schedule[] = selectedSemesters.map(sem => ({
        id: generateId(),
        details: {
            className: deptName,
            section: 'A',
            session: session,
            semester: sem.toString()
        },
        subjects: subjectsBySem[sem] || [],
        faculties: faculties,
        periods: DEFAULT_PERIODS,
        timeSlots: [],
        lastModified: Date.now(),
    }));
    onFinish(newSchedules);
  };

  const toggleSemester = (sem: number) => {
    if (selectedSemesters.includes(sem)) {
        setSelectedSemesters(prev => prev.filter(s => s !== sem).sort((a, b) => a - b));
    } else {
        setSelectedSemesters(prev => [...prev, sem].sort((a, b) => a - b));
    }
  };

  const updateSubjects = (sem: number, newSubjects: Subject[]) => {
      setSubjectsBySem(prev => ({ ...prev, [sem]: newSubjects }));
  };

  const isStep1Valid = deptName.trim() !== '' && session.trim() !== '' && selectedSemesters.length > 0;

  // --- Render Steps ---

  const renderStep1 = () => (
    <div className="pt-4">
      <h2 className="text-4xl font-black text-gray-900 mb-2">Department Setup</h2>
      <p className="text-gray-400 font-medium text-lg mb-10">Define your department and active semesters.</p>
      
      <div className="space-y-8">
        <Input
          label="Department Name"
          placeholder="Department Name"
          value={deptName}
          onChange={(e) => setDeptName(e.target.value)}
          icon={<GraduationCap size={24} />}
          autoFocus
        />
        <Input
          label="Academic Session"
          placeholder="Academic Session"
          value={session}
          onChange={(e) => setSession(e.target.value)}
          icon={<CalendarRange size={24} />}
        />
        
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-4">Select Active Semesters</label>
            <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                    const isSelected = selectedSemesters.includes(sem);
                    return (
                        <button
                            key={sem}
                            onClick={() => toggleSemester(sem)}
                            className={`
                                h-16 rounded-2xl font-black text-xl flex items-center justify-center transition-all duration-200
                                ${isSelected 
                                    ? 'bg-primary-600 text-white shadow-glow scale-105' 
                                    : 'bg-white text-gray-400 border-2 border-gray-100 hover:border-primary-200 hover:text-primary-500'}
                            `}
                        >
                            {sem}
                        </button>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-900">Subjects</h2>
        <p className="text-gray-400 font-medium">Add subjects for each semester.</p>
      </div>

      {/* Semester Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-2 no-scrollbar">
          {selectedSemesters.map(sem => (
              <button
                key={sem}
                onClick={() => setActiveSemTab(sem)}
                className={`
                    px-5 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all
                    ${activeSemTab === sem 
                        ? 'bg-gray-900 text-white shadow-lg' 
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}
                `}
              >
                  Semester {sem}
                  <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-md text-xs">
                      {subjectsBySem[sem]?.length || 0}
                  </span>
              </button>
          ))}
      </div>

      <div className="space-y-5">
        {(activeSemTab && subjectsBySem[activeSemTab]) ? (
            <>
                {subjectsBySem[activeSemTab].map((sub, idx) => (
                <div key={sub.id} className="bg-white p-6 rounded-[2rem] shadow-card hover:shadow-soft transition-shadow relative group">
                    <div className="flex justify-between items-start mb-6 gap-2">
                        <div className="flex-1">
                            <Input 
                                label="Subject Name"
                                placeholder="Subject Name"
                                value={sub.name}
                                onChange={(e) => {
                                    const list = [...subjectsBySem[activeSemTab]];
                                    list[idx].name = e.target.value;
                                    updateSubjects(activeSemTab, list);
                                }}
                                className="mb-0"
                            />
                        </div>
                        <button 
                            onClick={() => {
                                const list = subjectsBySem[activeSemTab].filter(s => s.id !== sub.id);
                                updateSubjects(activeSemTab, list);
                            }}
                            className="h-14 w-14 shrink-0 bg-red-50 rounded-full flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-100 transition-colors mt-6"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    <div className="mb-6">
                            <Input
                                label="Code"
                                placeholder="Code"
                                value={sub.code}
                                onChange={(e) => {
                                    const list = [...subjectsBySem[activeSemTab]];
                                    list[idx].code = e.target.value;
                                    updateSubjects(activeSemTab, list);
                                }}
                            />
                    </div>

                    <div className="space-y-3">
                        {/* Theory Row */}
                        <div className="flex items-center justify-between bg-blue-50/50 rounded-2xl p-2 pr-3">
                            <div className="flex items-center gap-3 pl-2">
                                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                                    <Book size={14} strokeWidth={2.5} />
                                </div>
                                <span className="text-sm font-bold text-blue-900/70">Theory</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm">
                                <button 
                                    className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                    onClick={() => {
                                        const list = [...subjectsBySem[activeSemTab]];
                                        if (list[idx].theoryCount > 0) list[idx].theoryCount--;
                                        updateSubjects(activeSemTab, list);
                                    }}
                                >
                                    <Minus size={14} strokeWidth={3} />
                                </button>
                                <input 
                                    type="number"
                                    value={sub.theoryCount}
                                    readOnly
                                    className="w-12 text-center text-sm font-bold text-gray-800 border-none bg-transparent outline-none"
                                />
                                <button 
                                    className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                    onClick={() => {
                                        const list = [...subjectsBySem[activeSemTab]];
                                        list[idx].theoryCount++;
                                        updateSubjects(activeSemTab, list);
                                    }}
                                >
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Lab Row */}
                        <div className="flex items-center justify-between bg-purple-50/50 rounded-2xl p-2 pr-3">
                            <div className="flex items-center gap-3 pl-2">
                                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-purple-500 shadow-sm">
                                    <Beaker size={14} strokeWidth={2.5} />
                                </div>
                                <span className="text-sm font-bold text-purple-900/70">Lab</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm">
                                <button 
                                    className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                                    onClick={() => {
                                        const list = [...subjectsBySem[activeSemTab]];
                                        if (list[idx].practicalCount > 0) list[idx].practicalCount--;
                                        updateSubjects(activeSemTab, list);
                                    }}
                                >
                                    <Minus size={14} strokeWidth={3} />
                                </button>
                                <input 
                                    type="number"
                                    value={sub.practicalCount}
                                    readOnly
                                    className="w-12 text-center text-sm font-bold text-gray-800 border-none bg-transparent outline-none"
                                />
                                <button 
                                    className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                                    onClick={() => {
                                        const list = [...subjectsBySem[activeSemTab]];
                                        list[idx].practicalCount++;
                                        updateSubjects(activeSemTab, list);
                                    }}
                                >
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                ))}
            </>
        ) : (
            <div className="text-center py-10 text-gray-400">Select a semester to add subjects</div>
        )}

        <button
            onClick={() => {
                if (!activeSemTab) return;
                const list = subjectsBySem[activeSemTab] || [];
                updateSubjects(activeSemTab, [...list, { 
                    id: generateId(), 
                    name: '', 
                    code: '', 
                    paperCode: '', 
                    theoryCount: 1, 
                    practicalCount: 0,
                    color: getRandomColor()
                }]);
            }}
            className="w-full py-5 border-2 border-dashed border-gray-300 rounded-[2rem] text-gray-400 font-bold hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 group"
        >
            <div className="bg-gray-100 group-hover:bg-primary-100 p-1 rounded-full transition-colors">
                <Plus size={16} />
            </div>
            Add Subject to Semester {activeSemTab}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900">Faculties</h2>
        <p className="text-gray-400 font-medium">Add all faculties for {deptName}.</p>
      </div>

      <div className="space-y-4">
        {faculties.map((fac, idx) => (
          <div key={fac.id} className="bg-white p-6 rounded-[2rem] shadow-card hover:shadow-soft border border-transparent hover:border-primary-100 transition-all group">
            
            <div className="flex items-center gap-3 mb-4">
                 <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      <Users size={20}/>
                 </div>
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Faculty Details</h3>
                 <div className="flex-1" />
                 <button 
                     onClick={() => setFaculties(faculties.filter(f => f.id !== fac.id))}
                     className="h-8 w-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                 >
                     <Trash2 size={16} />
                 </button>
            </div>
            
            <div className="space-y-4">
                 <Input
                     label="Faculty Name"
                     placeholder="Faculty Name"
                     value={fac.name}
                     onChange={(e) => {
                         const newFaculties = [...faculties];
                         const name = e.target.value;
                         newFaculties[idx].name = name;
                         if (!newFaculties[idx].initials && name.length > 0) {
                           newFaculties[idx].initials = generateInitials(name);
                         }
                         setFaculties(newFaculties);
                     }}
                     autoFocus={fac.name === ''}
                     icon={<User size={20} />}
                 />
                 <div className="w-1/2">
                     <Input
                         label="Initials"
                         placeholder="Initials"
                         value={fac.initials || ''}
                         maxLength={3}
                         onChange={(e) => {
                             const newFaculties = [...faculties];
                             newFaculties[idx].initials = e.target.value.toUpperCase();
                             setFaculties(newFaculties);
                         }}
                     />
                 </div>
            </div>
          </div>
        ))}

        <button
            onClick={() => setFaculties([...faculties, { id: generateId(), name: '', initials: '' }])}
            className="w-full py-5 border-2 border-dashed border-gray-300 rounded-[2rem] text-gray-400 font-bold hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 group"
        >
            <div className="bg-gray-100 group-hover:bg-primary-100 p-1 rounded-full transition-colors">
                 <Plus size={16} />
             </div>
            Add Faculty
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent pointer-events-none z-0" />

      {/* Nav */}
      <div className="px-6 py-6 sticky top-0 z-30 bg-gray-50/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
            <button 
                onClick={handleBack} 
                className="h-10 w-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 hover:text-primary-600 hover:scale-110 transition-all"
            >
                <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="flex space-x-2">
                {[1, 2, 3].map((s) => (
                    <div 
                        key={s} 
                        className={`h-2.5 rounded-full transition-all duration-500 ${s === step ? 'w-12 bg-primary-500' : s < step ? 'w-2.5 bg-primary-200' : 'w-2.5 bg-gray-200'}`} 
                    />
                ))}
            </div>
            <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-40 z-10">
        <div className="max-w-xl mx-auto w-full animate-fade-in-up">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-20 pointer-events-none">
        <div className="max-w-xl mx-auto w-full pointer-events-auto">
            <Button 
                onClick={handleNext} 
                fullWidth 
                size="lg"
                disabled={step === 1 && !isStep1Valid}
                className="shadow-glow"
                icon={step === TOTAL_STEPS ? undefined : <ArrowRight className="order-last ml-2" size={20} />}
            >
                {step === TOTAL_STEPS ? 'Create Department Schedule' : 'Continue'}
            </Button>
        </div>
      </div>
    </div>
  );
};