import React, { useState, useEffect } from 'react';
import { ChevronLeft, GraduationCap, Users, Book, Beaker, Minus, Plus, Trash2, ArrowRight, User, CalendarRange, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Subject, Faculty, Schedule, FIRST_YEAR_PERIODS, HIGHER_YEAR_PERIODS } from '../types';
import { generateId, getRandomColor } from '../utils';

interface WizardProps {
  onCancel: () => void;
  onFinish: (schedules: Schedule[]) => void;
  globalFaculties: Faculty[];
}

export const Wizard: React.FC<WizardProps> = ({ onCancel, onFinish, globalFaculties }) => {
  const [step, setStep] = useState(1);
  const [academicLevel, setAcademicLevel] = useState<'1st-year' | 'higher-year' | null>(null);
  
  // Basic Info
  const [session, setSession] = useState('');
  const [semester, setSemester] = useState<number>(1);
  const [deptName, setDeptName] = useState(''); 
  
  // Specifics
  const [branches, setBranches] = useState<string[]>(['Mechanical', 'Electrical', 'Civil']); 
  const [activeSemesters, setActiveSemesters] = useState<number[]>([3, 4, 5, 6]); 
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  
  // Subjects
  const [subjectsByGroup, setSubjectsByGroup] = useState<Record<string, Subject[]>>({});
  const [activeSubTab, setActiveSubTab] = useState<string>('');

  // Handle Level Selection with Pre-selection Logic
  const handleLevelSelect = (level: '1st-year' | 'higher-year') => {
    setAcademicLevel(level);
    setStep(2);
    if (level === '1st-year') {
        setSemester(1);
        setActiveSubTab('1'); 
    } else {
        setActiveSubTab('3');
        // Pre-select all higher year semesters by default
        setActiveSemesters([3, 4, 5, 6]);
    }
  };

  const handleFinish = () => {
    const periods = academicLevel === '1st-year' ? FIRST_YEAR_PERIODS : HIGHER_YEAR_PERIODS;
    const finalFaculties = globalFaculties.filter(f => selectedFaculties.includes(f.id));
    
    if (academicLevel === '1st-year') {
        const newSchedule: Schedule = {
            id: generateId(),
            details: { 
                className: "1st Year Combined", 
                section: "Combined", 
                session, 
                semester: semester.toString(),
                level: '1st-year',
                branches: branches.filter(b => b.trim() !== '')
            },
            subjects: subjectsByGroup['1'] || [],
            faculties: finalFaculties,
            periods: periods,
            timeSlots: [],
            lastModified: Date.now()
        };
        onFinish([newSchedule]);
    } else {
        const newSchedules: Schedule[] = activeSemesters.map(sem => ({
            id: generateId(),
            details: { 
                className: deptName, 
                section: "A", 
                session, 
                semester: sem.toString(),
                level: 'higher-year'
            },
            subjects: subjectsByGroup[sem.toString()] || [],
            faculties: finalFaculties,
            periods: periods,
            timeSlots: [],
            lastModified: Date.now()
        }));
        onFinish(newSchedules);
    }
  };

  const addSubject = (groupKey: string) => {
    const newSub = { id: generateId(), name: '', code: '', paperCode: '', theoryCount: 1, practicalCount: 0, color: getRandomColor() };
    setSubjectsByGroup(prev => ({ ...prev, [groupKey]: [...(prev[groupKey] || []), newSub] }));
  };

  const updateSubject = (groupKey: string, id: string, data: Partial<Subject>) => {
    setSubjectsByGroup(prev => ({
        ...prev,
        [groupKey]: prev[groupKey].map(s => s.id === id ? { ...s, ...data } : s)
    }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      <div className="px-6 py-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
          <button onClick={() => step > 1 ? setStep(step - 1) : onCancel()} className="h-12 w-12 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-500 hover:text-primary-500 transition-all">
              <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
              {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-10 bg-primary-500' : 'w-2 bg-gray-200 dark:bg-slate-800'}`} />
              ))}
          </div>
          <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full pb-32">
        {step === 1 && (
            <div className="animate-fade-in-up space-y-2">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">New Schedule</h2>
                <p className="text-gray-400 font-medium text-lg mb-10">Select the year level to configure.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <button onClick={() => handleLevelSelect('1st-year')} className="p-8 bg-gray-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-transparent hover:border-primary-500 hover:bg-white dark:hover:bg-slate-800 transition-all text-left group shadow-soft">
                        <Users className="h-12 w-12 text-primary-500 mb-6" />
                        <h4 className="text-2xl font-black dark:text-white tracking-tight">1st Year</h4>
                        <p className="text-sm text-gray-400 mt-2 font-medium leading-relaxed">Single common timetable for all branches.</p>
                    </button>
                    <button onClick={() => handleLevelSelect('higher-year')} className="p-8 bg-gray-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-transparent hover:border-primary-500 hover:bg-white dark:hover:bg-slate-800 transition-all text-left group shadow-soft">
                        <Beaker className="h-12 w-12 text-primary-500 mb-6" />
                        <h4 className="text-2xl font-black dark:text-white tracking-tight">Higher Years</h4>
                        <p className="text-sm text-gray-400 mt-2 font-medium leading-relaxed">Separate branch-wise departmental schedules.</p>
                    </button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="animate-fade-in-up space-y-10 pt-4">
                <h2 className="text-4xl font-black dark:text-white tracking-tight">Basic Details</h2>
                
                <div className="space-y-8">
                  <Input label="Academic Session" placeholder="e.g. 2024-25" value={session} onChange={e => setSession(e.target.value)} icon={<CalendarRange size={24} />} />
                  
                  {academicLevel === '1st-year' ? (
                      <>
                          <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-3">Select Semester</label>
                              <div className="grid grid-cols-2 gap-3">
                                  {[1, 2].map(s => (
                                      <button 
                                        key={s} 
                                        onClick={() => setSemester(s)} 
                                        className={`h-12 rounded-2xl font-bold transition-all text-sm ${semester === s ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                      >
                                        Sem {s}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div>
                              <div className="flex justify-between items-center mb-3 px-3">
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Branches</label>
                                  <button onClick={() => setBranches([...branches, ''])} className="text-primary-500 text-[10px] font-black uppercase hover:underline">+ Add</button>
                              </div>
                              <div className="space-y-3">
                                  {branches.map((b, i) => (
                                      <div key={i} className="flex gap-3 animate-fade-in-up">
                                          <Input placeholder="Branch Name" value={b} onChange={e => { const nb = [...branches]; nb[i] = e.target.value; setBranches(nb); }} />
                                          <button onClick={() => setBranches(branches.filter((_, idx) => idx !== i))} className="h-14 w-14 flex items-center justify-center text-red-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </>
                  ) : (
                      <>
                          <Input label="Department Name" placeholder="e.g. Mechanical Engineering" value={deptName} onChange={e => setDeptName(e.target.value)} icon={<GraduationCap size={24} />} />
                          <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-3">Active Semesters</label>
                              <div className="grid grid-cols-4 gap-3">
                                  {[3, 4, 5, 6].map(s => (
                                      <button 
                                        key={s} 
                                        onClick={() => setActiveSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s].sort())} 
                                        className={`h-12 rounded-2xl font-bold flex items-center justify-center transition-all text-sm ${activeSemesters.includes(s) ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                      >
                                        {s}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </>
                  )}
                </div>
                
                <div className="pt-4">
                  <Button fullWidth onClick={() => setStep(3)} size="lg" className="rounded-3xl py-5 shadow-glow">Continue to Subjects</Button>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="animate-fade-in-up pt-4">
                <h2 className="text-4xl font-black dark:text-white tracking-tight mb-2">Subject Entry</h2>
                <p className="text-gray-400 text-lg font-medium mb-10">Add academic load for each semester.</p>
                
                {academicLevel === 'higher-year' && (
                    <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2">
                        {activeSemesters.map(sem => (
                            <button 
                              key={sem} 
                              onClick={() => setActiveSubTab(sem.toString())} 
                              className={`px-6 py-2.5 rounded-full text-xs font-black transition-all whitespace-nowrap shadow-sm ${activeSubTab === sem.toString() ? 'bg-primary-500 text-white shadow-primary-500/30' : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-400 hover:border-primary-200'}`}
                            >
                              Semester {sem}
                            </button>
                        ))}
                    </div>
                )}

                <div className="space-y-5">
                    {(subjectsByGroup[activeSubTab || (academicLevel === '1st-year' ? '1' : '')] || []).map((sub, idx) => (
                        <div key={sub.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-card animate-fade-in-up">
                            <div className="flex justify-between items-start mb-6 gap-4">
                                <Input label="Subject Name" value={sub.name} onChange={e => updateSubject(activeSubTab || '1', sub.id, { name: e.target.value })} />
                                <button onClick={() => setSubjectsByGroup(prev => ({ ...prev, [activeSubTab]: prev[activeSubTab].filter(s => s.id !== sub.id) }))} className="text-red-200 hover:text-red-500 mt-8 transition-colors"><Trash2 size={24} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-3 px-5 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-gray-400">Theory</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => updateSubject(activeSubTab, sub.id, { theoryCount: Math.max(0, sub.theoryCount - 1) })} className="p-1 hover:text-primary-500 transition-colors"><Minus size={18} /></button>
                                        <span className="font-black text-sm w-4 text-center dark:text-white">{sub.theoryCount}</span>
                                        <button onClick={() => updateSubject(activeSubTab, sub.id, { theoryCount: sub.theoryCount + 1 })} className="p-1 hover:text-primary-500 transition-colors"><Plus size={18} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-3 px-5 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-gray-400">Lab</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => updateSubject(activeSubTab, sub.id, { practicalCount: Math.max(0, sub.practicalCount - 1) })} className="p-1 hover:text-primary-500 transition-colors"><Minus size={18} /></button>
                                        <span className="font-black text-sm w-4 text-center dark:text-white">{sub.practicalCount}</span>
                                        <button onClick={() => updateSubject(activeSubTab, sub.id, { practicalCount: sub.practicalCount + 1 })} className="p-1 hover:text-primary-500 transition-colors"><Plus size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => addSubject(activeSubTab || (academicLevel === '1st-year' ? '1' : ''))} className="w-full py-6 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[2.5rem] text-gray-400 dark:text-slate-600 font-black hover:bg-gray-50 dark:hover:bg-slate-900 hover:border-primary-200 transition-all">+ Add Subject</button>
                </div>
                <div className="mt-12">
                    <Button fullWidth onClick={() => setStep(4)} size="lg" className="rounded-3xl py-5 shadow-glow">Assign Faculty Members</Button>
                </div>
            </div>
        )}

        {step === 4 && (
            <div className="animate-fade-in-up pt-4">
                <h2 className="text-4xl font-black dark:text-white tracking-tight mb-2">Assign Faculty</h2>
                <p className="text-gray-400 text-lg font-medium mb-10">Choose from the global college faculty list.</p>
                
                <div className="grid grid-cols-1 gap-3">
                    {globalFaculties.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-slate-800 px-6">
                            <User size={48} className="mx-auto text-gray-200 dark:text-slate-700 mb-4" />
                            <p className="text-gray-400 font-black">No global faculties found.</p>
                            <p className="text-[10px] uppercase font-bold text-gray-300 mt-2">Add them on the Home screen first.</p>
                        </div>
                    ) : (
                        globalFaculties.map(f => {
                            const selected = selectedFaculties.includes(f.id);
                            return (
                                <button key={f.id} onClick={() => setSelectedFaculties(prev => selected ? prev.filter(id => id !== f.id) : [...prev, f.id])} className={`p-5 rounded-[2rem] border-2 flex items-center justify-between transition-all ${selected ? 'bg-primary-50 border-primary-500 dark:bg-primary-900/20 dark:border-primary-500' : 'bg-gray-50/50 border-gray-100 hover:border-gray-300 dark:bg-slate-900/50 dark:border-slate-800 text-gray-500'}`}>
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm border border-gray-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{f.initials}</div>
                                        <div className="text-left">
                                            <span className="font-black text-gray-900 dark:text-white block">{f.name}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Faculty Member</span>
                                        </div>
                                    </div>
                                    {selected && <div className="h-8 w-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg"><Check size={18} strokeWidth={4} /></div>}
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="mt-12">
                    <Button fullWidth onClick={handleFinish} size="lg" className="rounded-3xl py-5 shadow-glow" disabled={selectedFaculties.length === 0}>Create Schedules</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};