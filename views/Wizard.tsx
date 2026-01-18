
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
  const [deptName, setDeptName] = useState('');
  const [session, setSession] = useState('');
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [subjectsBySem, setSubjectsBySem] = useState<Record<number, Subject[]>>({});
  const [activeSemTab, setActiveSemTab] = useState<number | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  const handleNext = () => {
    if (step === 1) {
        if (selectedSemesters.length === 0) return;
        const newSubMap = { ...subjectsBySem };
        selectedSemesters.forEach(s => { if (!newSubMap[s]) newSubMap[s] = []; });
        setSubjectsBySem(newSubMap);
        setActiveSemTab(selectedSemesters[0]);
        setStep(2);
    } else if (step === 2) { setStep(3); } 
    else { finishWizard(); }
  };

  const finishWizard = () => {
    const newSchedules: Schedule[] = selectedSemesters.map(sem => ({
        id: generateId(),
        details: { className: deptName, section: 'A', session: session, semester: sem.toString() },
        subjects: subjectsBySem[sem] || [],
        faculties: faculties,
        periods: DEFAULT_PERIODS,
        timeSlots: [],
        lastModified: Date.now(),
    }));
    onFinish(newSchedules);
  };

  const isStep1Valid = deptName.trim() !== '' && session.trim() !== '' && selectedSemesters.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      <div className="px-6 py-6 sticky top-0 z-30 bg-gray-50/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
            <button onClick={() => step > 1 ? setStep(step - 1) : onCancel()} className="h-10 w-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 hover:text-primary-600 hover:scale-110 transition-all">
                <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="flex space-x-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-2.5 rounded-full transition-all duration-500 ${s === step ? 'w-12 bg-primary-500' : s < step ? 'w-2.5 bg-primary-200' : 'w-2.5 bg-gray-200'}`} />
                ))}
            </div>
            <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-40 z-10">
        <div className="max-w-xl mx-auto w-full animate-fade-in-up">
          {step === 1 && (
            <div className="pt-4">
              <h2 className="text-4xl font-black text-gray-900 mb-2">Department Setup</h2>
              <p className="text-gray-400 font-medium text-lg mb-10">Define your department and active semesters.</p>
              <div className="space-y-8">
                <Input label="Department Name" placeholder="Department Name" value={deptName} onChange={(e) => setDeptName(e.target.value)} icon={<GraduationCap size={24} />} autoFocus />
                <Input label="Academic Session" placeholder="Academic Session" value={session} onChange={(e) => setSession(e.target.value)} icon={<CalendarRange size={24} />} />
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-4">Select Active Semesters</label>
                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                            <button key={sem} onClick={() => setSelectedSemesters(prev => prev.includes(sem) ? prev.filter(s => s !== sem).sort((a,b) => a-b) : [...prev, sem].sort((a,b) => a-b))} className={`h-16 rounded-2xl font-black text-xl flex items-center justify-center transition-all duration-200 ${selectedSemesters.includes(sem) ? 'bg-primary-600 text-white shadow-glow scale-105' : 'bg-white text-gray-400 border-2 border-gray-100 hover:border-primary-200 hover:text-primary-500'}`}>{sem}</button>
                        ))}
                    </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-6"><h2 className="text-3xl font-black text-gray-900">Subjects</h2><p className="text-gray-400 font-medium">Add subjects for each semester.</p></div>
              <div className="flex overflow-x-auto gap-2 pb-4 mb-2 no-scrollbar">
                  {selectedSemesters.map(sem => (
                      <button key={sem} onClick={() => setActiveSemTab(sem)} className={`px-5 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all ${activeSemTab === sem ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>Semester {sem} <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-md text-xs">{subjectsBySem[sem]?.length || 0}</span></button>
                  ))}
              </div>
              <div className="space-y-5">
                {activeSemTab && subjectsBySem[activeSemTab]?.map((sub, idx) => (
                  <div key={sub.id} className="bg-white p-6 rounded-[2rem] shadow-card relative group">
                    <div className="flex justify-between items-start mb-6 gap-2">
                      <Input label="Subject Name" placeholder="Subject Name" value={sub.name} onChange={(e) => { const list = [...subjectsBySem[activeSemTab]]; list[idx].name = e.target.value; setSubjectsBySem({...subjectsBySem, [activeSemTab]: list}); }} />
                      <button onClick={() => { const list = subjectsBySem[activeSemTab].filter(s => s.id !== sub.id); setSubjectsBySem({...subjectsBySem, [activeSemTab]: list}); }} className="h-14 w-14 shrink-0 bg-red-50 rounded-full flex items-center justify-center text-red-400 mt-6"><Trash2 size={20} /></button>
                    </div>
                    <Input label="Subject Code" placeholder="Subject Code" value={sub.code} onChange={(e) => { const list = [...subjectsBySem[activeSemTab]]; list[idx].code = e.target.value; setSubjectsBySem({...subjectsBySem, [activeSemTab]: list}); }} className="mb-6" />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between bg-blue-50/50 rounded-2xl p-2 pr-3">
                            <span className="text-sm font-bold text-blue-900/70 ml-2">Theory Hours</span>
                            <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm">
                                <button onClick={() => { const list = [...subjectsBySem[activeSemTab]]; if (list[idx].theoryCount > 0) list[idx].theoryCount--; setSubjectsBySem({...subjectsBySem, [activeSemTab]: list}); }} className="h-8 w-8 text-gray-400"><Minus size={14} /></button>
                                <span className="w-12 text-center text-sm font-bold">{sub.theoryCount}</span>
                                <button onClick={() => { const list = [...subjectsBySem[activeSemTab]]; list[idx].theoryCount++; setSubjectsBySem({...subjectsBySem, [activeSemTab]: list}); }} className="h-8 w-8 text-gray-400"><Plus size={14} /></button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-purple-50/50 rounded-2xl p-2 pr-3">
                            <span className="text-sm font-bold text-purple-900/70 ml-2">Lab Hours</span>
                            <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm">
                                <button onClick={() => { const list = [...subjectsBySem[activeSemTab]]; if (list[idx].practicalCount > 0) list[idx].practicalCount--; setSubjectsBySem({...subjectsBySem, [activeSemTab]: list}); }} className="h-8 w-8 text-gray-400"><Minus size={14} /></button>
                                <span className="w-12 text-center text-sm font-bold">{sub.practicalCount}</span>
                                <button onClick={() => { const list = [...subjectsBySem[activeSemTab]]; list[idx].practicalCount++; setSubjectsBySem({...subjectsBySem, [activeSemTab]: list}); }} className="h-8 w-8 text-gray-400"><Plus size={14} /></button>
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => activeSemTab && setSubjectsBySem({...subjectsBySem, [activeSemTab]: [...(subjectsBySem[activeSemTab]||[]), {id: generateId(), name:'', code:'', paperCode:'', theoryCount:1, practicalCount:0, color: getRandomColor()}]})} className="w-full py-5 border-2 border-dashed border-gray-300 rounded-[2rem] text-gray-400 font-bold hover:bg-primary-50 flex items-center justify-center gap-2"><Plus size={16} /> Add Subject</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mb-8"><h2 className="text-3xl font-black text-gray-900">Faculties</h2><p className="text-gray-400 font-medium">Add all faculties for the department.</p></div>
              <div className="space-y-4">
                {faculties.map((fac, idx) => (
                  <div key={fac.id} className="bg-white p-6 rounded-[2rem] shadow-card group">
                    <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Faculty Details</span><button onClick={() => setFaculties(faculties.filter(f => f.id !== fac.id))} className="text-red-400"><Trash2 size={16}/></button></div>
                    <div className="space-y-4">
                        <Input label="Faculty Name" placeholder="Faculty Name" value={fac.name} onChange={(e) => { const list = [...faculties]; list[idx].name = e.target.value; if (!list[idx].initials) list[idx].initials = generateInitials(e.target.value); setFaculties(list); }} icon={<User size={20} />} />
                        <div className="w-1/2"><Input label="Initials" placeholder="Initials" value={fac.initials || ''} maxLength={3} onChange={(e) => { const list = [...faculties]; list[idx].initials = e.target.value.toUpperCase(); setFaculties(list); }} /></div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setFaculties([...faculties, { id: generateId(), name: '', initials: '' }])} className="w-full py-5 border-2 border-dashed border-gray-300 rounded-[2rem] text-gray-400 font-bold hover:bg-primary-50 flex items-center justify-center gap-2"><Plus size={16} /> Add Faculty</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none">
        <div className="max-w-xl mx-auto w-full pointer-events-auto">
            <Button onClick={handleNext} fullWidth size="lg" disabled={step === 1 && !isStep1Valid} className="shadow-glow" icon={step === TOTAL_STEPS ? undefined : <ArrowRight className="ml-2" size={20} />}>
                {step === TOTAL_STEPS ? 'Create Department Schedule' : 'Continue'}
            </Button>
        </div>
      </div>
    </div>
  );
};
