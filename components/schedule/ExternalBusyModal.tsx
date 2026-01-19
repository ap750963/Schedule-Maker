import React, { useState } from 'react';
import { X, Plus, Building } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomSelect } from '../ui/CustomSelect';
import { Faculty, Period, DAYS } from '../../types';

interface ExternalBusyModalProps {
  faculties: Faculty[];
  periods: Period[];
  initialDay?: string;
  initialPeriodId?: number;
  onSave: (facultyIds: string[], day: string, periodId: number, details: { department: string; semester: string; subject: string }) => void;
  onClose: () => void;
}

export const ExternalBusyModal: React.FC<ExternalBusyModalProps> = ({
  faculties, periods, initialDay, initialPeriodId, onSave, onClose
}) => {
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [day, setDay] = useState<string>(initialDay || DAYS[0]);
  const [periodId, setPeriodId] = useState<number>(initialPeriodId || periods[0]?.id || 0);
  const [details, setDetails] = useState({ department: '', semester: '', subject: '' });

  const handleAdd = () => {
    if (selectedFaculties.length === 0 || !details.department || !details.semester || !details.subject) return;
    onSave(selectedFaculties, day, periodId, details);
    setSelectedFaculties([]);
    setDetails({ department: '', semester: '', subject: '' });
  };

  const getFacultyName = (id: string) => faculties.find(f => f.id === id)?.name || id;
  const sortedFaculties = [...faculties].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gray-900/10 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl animate-fade-in-up border border-gray-100 dark:border-slate-700 relative overflow-hidden" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-50 dark:border-slate-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-slate-700/20">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 dark:text-rose-400">
                    <Building size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">External Engagement</h3>
                    <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400">Mark faculties as busy elsewhere</p>
                </div>
             </div>
             <button onClick={onClose} className="h-8 w-8 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full flex items-center justify-center text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-all">
               <X size={16} />
             </button>
          </div>

          <div className="p-6 space-y-5">
                <div>
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block ml-1">Assign Faculties</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {selectedFaculties.map(fid => (
                            <div key={fid} className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/40 text-primary-700 dark:text-primary-300 pl-3 pr-2 py-1 rounded-xl text-xs font-bold flex items-center gap-2">
                                {getFacultyName(fid)}
                                <button onClick={() => setSelectedFaculties(prev => prev.filter(id => id !== fid))} className="hover:text-red-500"><X size={12} /></button>
                            </div>
                        ))}
                    </div>
                    <CustomSelect
                        value=""
                        placeholder="+ Add Faculty"
                        options={sortedFaculties.filter(f => !selectedFaculties.includes(f.id)).map(f => ({ value: f.id, label: f.name }))}
                        onChange={(val) => setSelectedFaculties(prev => [...prev, val])}
                        icon={<Plus size={18} />}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block ml-1">Day</label>
                        <CustomSelect 
                            value={day} 
                            options={DAYS.map(d => ({ value: d, label: d }))} 
                            onChange={setDay} 
                            disabled={!!initialDay}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block ml-1">Time Slot</label>
                        <CustomSelect 
                            value={periodId.toString()} 
                            options={periods.filter(p => !p.isBreak).map(p => ({ value: p.id.toString(), label: p.label, dropdownLabel: `${p.label} (${p.time})` }))} 
                            onChange={(val) => setPeriodId(parseInt(val))} 
                            disabled={!!initialPeriodId}
                        />
                    </div>
                </div>

                <div className="space-y-3 bg-gray-50 dark:bg-slate-700/30 p-3 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                    <Input 
                        placeholder="Department (e.g. Civil)" 
                        value={details.department} 
                        onChange={e => setDetails({...details, department: e.target.value})} 
                        className="bg-white dark:bg-slate-800 text-sm py-2.5"
                    />
                    <Input 
                        placeholder="Semester (e.g. 3rd)" 
                        value={details.semester} 
                        onChange={e => setDetails({...details, semester: e.target.value})} 
                        className="bg-white dark:bg-slate-800 text-sm py-2.5"
                    />
                    <Input 
                        placeholder="Subject (e.g. Structural Eng)" 
                        value={details.subject} 
                        onChange={e => setDetails({...details, subject: e.target.value})} 
                        className="bg-white dark:bg-slate-800 text-sm py-2.5"
                    />
                </div>

                <Button onClick={handleAdd} fullWidth disabled={selectedFaculties.length === 0} className="rounded-2xl shadow-glow">Add Engagement</Button>
          </div>
        </div>
      </div>
    </div>
  );
};