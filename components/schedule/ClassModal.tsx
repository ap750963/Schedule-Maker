
import React, { useState, useMemo } from 'react';
import { X, Trash2, AlertCircle, Clock, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { CustomSelect, Option } from '../ui/CustomSelect';
import { TimeSlot, Subject, Schedule } from '../../types';

interface ClassModalProps {
  data: Partial<TimeSlot>;
  schedule: Schedule; 
  allSchedules?: Schedule[]; 
  day: string;
  periodLabel?: string;
  onClose: () => void;
  onSave: (data: Partial<TimeSlot>) => void;
  onDelete: () => void;
  onCheckConflict?: (facultyId: string, currentSlotData: Partial<TimeSlot>) => string | null;
}

export const ClassModal: React.FC<ClassModalProps> = ({ 
  data, schedule, day, periodLabel, onClose, onSave, onDelete, onCheckConflict
}) => {
  const [tempSlotData, setTempSlotData] = useState<Partial<TimeSlot>>(data);

  const getSubjectUsage = (subject: Subject) => {
    const placedSlots = schedule.timeSlots.filter(s => s.subjectId === subject.id && s.id !== tempSlotData.id);
    
    const usedTheory = placedSlots
        .filter(s => s.type === 'Theory')
        .reduce((acc, s) => acc + (s.duration || 1), 0);
        
    const usedPractical = placedSlots
        .filter(s => s.type === 'Practical')
        .reduce((acc, s) => acc + (s.duration || 1), 0);

    return {
        usedTheory,
        usedPractical,
        theoryRemaining: subject.theoryCount - usedTheory,
        practicalRemaining: subject.practicalCount - usedPractical,
        isTheoryFull: usedTheory >= subject.theoryCount,
        isPracticalFull: usedPractical >= subject.practicalCount
    };
  };

  const currentSubject = schedule.subjects.find(s => s.id === tempSlotData.subjectId);

  const subjectOptions: Option[] = schedule.subjects.map(s => {
    const stats = getSubjectUsage(s);
    const isTheory = tempSlotData.type === 'Theory';
    const isFull = isTheory ? stats.isTheoryFull : stats.isPracticalFull;
    const remaining = isTheory ? stats.theoryRemaining : stats.practicalRemaining;
    const isCurrent = tempSlotData.subjectId === s.id;
    const label = s.code ? `${s.name} (${s.code})` : s.name;
    
    return {
        value: s.id,
        label: label,
        dropdownLabel: (
            <div className="flex items-center justify-between w-full">
                <span className="truncate pr-2">{label}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${isFull && !isCurrent ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300'}`}>
                    {Math.max(0, remaining)} Left
                </span>
            </div>
        ),
        disabled: !isCurrent && isFull
    };
  });

  const facultyOptions: Option[] = schedule.faculties.map(f => {
    const isSelected = tempSlotData.facultyIds?.includes(f.id);
    const conflict = onCheckConflict ? onCheckConflict(f.id, tempSlotData) : null;
    
    if (isSelected) return null;

    return {
        value: f.id,
        label: `${f.name} (${f.initials})`,
        dropdownLabel: (
          <div className="flex items-center justify-between w-full">
            <span className="truncate pr-2">{f.name} ({f.initials})</span>
            {conflict && (
              <span className="text-[9px] font-black bg-rose-50 dark:bg-rose-900/40 text-rose-500 dark:text-rose-300 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                Busy: {conflict}
              </span>
            )}
          </div>
        )
    };
  }).filter(Boolean) as Option[];

  // UPDATED: Only Subject is mandatory. Faculty is now optional.
  const isSaveDisabled = !tempSlotData.subjectId;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/10 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="flex min-h-full items-center justify-center p-4">
            <div 
                className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl animate-fade-in-up border border-gray-100 dark:border-slate-700 relative my-8 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-700/50 flex justify-between items-start bg-gray-50/50 dark:bg-slate-700/20">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            {tempSlotData.subjectId ? 'Edit Class' : 'Add Class'}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                {day}
                            </span>
                            <span className="text-gray-300 dark:text-slate-600">|</span>
                            <span className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
                                {periodLabel}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="h-10 w-10 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full flex items-center justify-center text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-500 transition-all"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block ml-1">Class Type</label>
                        <div className="bg-gray-100 dark:bg-slate-700 p-1.5 rounded-[1.5rem] flex relative">
                            <button 
                                className={`flex-1 py-4 text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${tempSlotData.type === 'Theory' ? 'bg-white dark:bg-slate-800 text-orange-500 dark:text-orange-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'}`}
                                onClick={() => setTempSlotData({ ...tempSlotData, type: 'Theory', duration: 1 })}
                            >
                                <div className={`h-2 w-2 rounded-full ${tempSlotData.type === 'Theory' ? 'bg-orange-500 dark:bg-orange-400' : 'bg-gray-300 dark:bg-slate-600'}`} />
                                Theory
                            </button>
                            <button 
                                className={`flex-1 py-4 text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${tempSlotData.type === 'Practical' ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'}`}
                                onClick={() => {
                                    setTempSlotData({ ...tempSlotData, type: 'Practical', duration: 2 });
                                }}
                            >
                                <div className={`h-2 w-2 rounded-full ${tempSlotData.type === 'Practical' ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-slate-600'}`} />
                                Lab
                            </button>
                        </div>
                        
                        {tempSlotData.type === 'Practical' && (
                                <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => setTempSlotData({ ...tempSlotData, duration: 1 })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${tempSlotData.duration === 1 ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-100 dark:border-slate-600 text-gray-400 dark:text-slate-400'}`}
                                >
                                    1 Hour
                                </button>
                                <button
                                    onClick={() => setTempSlotData({ ...tempSlotData, duration: 2 })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${tempSlotData.duration === 2 ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-100 dark:border-slate-600 text-gray-400 dark:text-slate-400'}`}
                                >
                                    2 Hours
                                </button>
                                </div>
                        )}
                    </div>

                    <div>
                        <CustomSelect
                            label="Subject"
                            placeholder="Select Subject"
                            value={tempSlotData.subjectId || ''}
                            options={subjectOptions}
                            onChange={(val) => setTempSlotData({ ...tempSlotData, subjectId: val })}
                        />
                        
                        {tempSlotData.subjectId && currentSubject && (() => {
                            const stats = getSubjectUsage(currentSubject);
                            const isFull = tempSlotData.type === 'Theory' ? stats.isTheoryFull : stats.isPracticalFull;
                            const remaining = tempSlotData.type === 'Theory' ? stats.theoryRemaining : stats.practicalRemaining;
                            const typeName = tempSlotData.type === 'Theory' ? 'Theory' : 'Practical';
                            
                            if (isFull) {
                                    return (
                                    <div className="flex items-center gap-2 mt-2 text-red-500 dark:text-red-400 text-xs font-bold animate-pulse ml-1">
                                        <AlertCircle size={12} />
                                        <span>{typeName} hours completed for {currentSubject.name}</span>
                                    </div>
                                    );
                            } else {
                                    return (
                                    <div className="flex items-center gap-2 mt-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold ml-1">
                                        <Clock size={12} />
                                        <span>{remaining} {typeName} hour{remaining !== 1 ? 's' : ''} remaining</span>
                                    </div>
                                    );
                            }
                        })()}
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block ml-1 flex justify-between">
                            Assign Faculties
                            <span className="text-gray-400 dark:text-slate-600 text-[9px] uppercase">Optional</span>
                        </label>

                        <div className="flex flex-wrap gap-2 mb-3 p-1 rounded-2xl transition-all">
                            {(tempSlotData.facultyIds || []).map(fid => {
                                    const fac = schedule.faculties.find(f => f.id === fid);
                                    if (!fac) return null;
                                    const conflictDetail = onCheckConflict ? onCheckConflict(fid, tempSlotData) : null;

                                    return (
                                        <div key={fid} className={`${conflictDetail ? 'bg-rose-50 dark:bg-rose-900/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300' : 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-900/40 text-primary-700 dark:text-primary-300'} border pl-3 pr-2 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in-up relative overflow-hidden group/tag`}>
                                            {fac.name} ({fac.initials})
                                            {conflictDetail && <AlertTriangle size={10} className="text-rose-500" />}
                                            <button 
                                              onClick={() => setTempSlotData(prev => ({ 
                                                  ...prev, 
                                                  facultyIds: prev.facultyIds?.filter(id => id !== fid) 
                                              }))}
                                              className="h-5 w-5 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                                            >
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                        </div>
                                    );
                            })}
                            {(tempSlotData.facultyIds || []).length === 0 && (
                                <div className="text-gray-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest py-2 px-2">No faculty assigned</div>
                            )}
                        </div>

                        <CustomSelect
                            value=""
                            placeholder="+ Add Faculty"
                            options={facultyOptions}
                            icon={<Plus size={20} strokeWidth={3} />}
                            dropdownMode="relative"
                            onChange={(val) => {
                                if (!val) return;
                                setTempSlotData(prev => {
                                    const current = prev.facultyIds || [];
                                    if (current.includes(val)) return prev;
                                    return { ...prev, facultyIds: [...current, val] };
                                });
                            }}
                        />
                            
                        <div className="space-y-2 mt-3">
                        {(tempSlotData.facultyIds || []).map(fid => {
                            const conflict = onCheckConflict ? onCheckConflict(fid, tempSlotData) : null;
                            if (!conflict) return null;
                            const fac = schedule.faculties.find(f => f.id === fid);
                            return (
                                <div key={fid} className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                    <AlertTriangle size={14} className="shrink-0 text-rose-500"/> 
                                    <span><strong>{fac?.initials} Overlap:</strong> Already scheduled in {conflict}</span>
                                </div>
                            )
                        })}
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-2 flex gap-4">
                    {tempSlotData.id && (
                        <button 
                            onClick={onDelete}
                            className="h-14 w-14 shrink-0 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95"
                            title="Delete Class"
                        >
                            <Trash2 size={24} />
                        </button>
                    )}
                    <Button 
                        onClick={() => onSave(tempSlotData)}
                        fullWidth 
                        size="lg" 
                        disabled={isSaveDisabled} 
                        className="shadow-glow rounded-2xl text-lg disabled:shadow-none disabled:bg-gray-100 dark:disabled:bg-slate-700/50"
                    >
                        {tempSlotData.id ? 'Save Changes' : 'Add to Schedule'}
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
};
