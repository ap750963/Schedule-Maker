import React, { useState } from 'react';
import { X, Trash2, AlertCircle, Clock, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { CustomSelect, Option } from '../ui/CustomSelect';
import { Input } from '../ui/Input';
import { TimeSlot, Subject, Schedule } from '../../types';

interface ClassModalProps {
  data: Partial<TimeSlot>;
  schedule: Schedule; 
  day: string;
  periodLabel?: string;
  onClose: () => void;
  onSave: (data: Partial<TimeSlot>) => void;
  onDelete: () => void;
  conflicts?: Record<string, string>; 
  onCheckConflict?: (facultyId: string) => string | null;
}

export const ClassModal: React.FC<ClassModalProps> = ({ 
  data, schedule, day, periodLabel, onClose, onSave, onDelete, conflicts 
}) => {
  const [tempSlotData, setTempSlotData] = useState<Partial<TimeSlot>>({
      ...data,
      externalDetails: data.externalDetails || { dept: '', semester: '', subject: '' }
  });
  const isExternalBusy = schedule.id === 'external-busy';

  const getSubjectUsage = (subject: Subject) => {
    const placedSlots = schedule.timeSlots.filter(s => s.subjectId === subject.id && s.id !== tempSlotData.id);
    
    const usedTheory = placedSlots.filter(s => s.type === 'Theory').reduce((acc, s) => acc + (s.duration || 1), 0);
    const usedPractical = placedSlots.filter(s => s.type === 'Practical').reduce((acc, s) => acc + (s.duration || 1), 0);

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

  const updateExternalDetail = (field: keyof NonNullable<TimeSlot['externalDetails']>, value: string) => {
      setTempSlotData(prev => ({
          ...prev,
          externalDetails: {
              dept: '', semester: '', subject: '',
              ...(prev.externalDetails || {}),
              [field]: value
          }
      }));
  };

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
    const conflict = conflicts ? conflicts[f.id] : null;
    if (isSelected) return null;
    return {
        value: f.id,
        label: `${f.name} (${f.initials})${conflict ? ' (Busy)' : ''}`,
    };
  }).filter(Boolean) as Option[];

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gray-900/10 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="flex min-h-full items-center justify-center p-4">
            <div 
                className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl animate-fade-in-up border border-gray-100 dark:border-slate-700 relative my-8 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-700/50 flex justify-between items-start bg-gray-50/50 dark:bg-slate-700/20">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                            {isExternalBusy ? 'External Busy Details' : (tempSlotData.subjectId ? 'Edit Class' : 'Add Class')}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                {day}
                            </span>
                            <span className="text-gray-300 dark:text-slate-600">|</span>
                            <span className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                                {periodLabel}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="h-8 w-8 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full flex items-center justify-center text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-500 transition-all"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>
                
                <div className="p-5 space-y-4">
                        {!isExternalBusy && (
                            <div>
                                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Class Type</label>
                                <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-2xl flex relative">
                                    <button 
                                        className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${tempSlotData.type === 'Theory' ? 'bg-white dark:bg-slate-800 text-orange-500 dark:text-orange-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'}`}
                                        onClick={() => setTempSlotData({ ...tempSlotData, type: 'Theory', facultyIds: [], duration: 1 })}
                                    >
                                        <div className={`h-1.5 w-1.5 rounded-full ${tempSlotData.type === 'Theory' ? 'bg-orange-500 dark:bg-orange-400' : 'bg-gray-300 dark:bg-slate-600'}`} />
                                        Theory
                                    </button>
                                    <button 
                                        className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${tempSlotData.type === 'Practical' ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'}`}
                                        onClick={() => {
                                            setTempSlotData({ ...tempSlotData, type: 'Practical', facultyIds: [] });
                                        }}
                                    >
                                        <div className={`h-1.5 w-1.5 rounded-full ${tempSlotData.type === 'Practical' ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-slate-600'}`} />
                                        Lab
                                    </button>
                                </div>
                                
                                {tempSlotData.type === 'Practical' && (
                                        <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => setTempSlotData({ ...tempSlotData, duration: 1 })}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${tempSlotData.duration === 1 ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-100 dark:border-slate-600 text-gray-400 dark:text-slate-400'}`}
                                        >
                                            1 Hour
                                        </button>
                                        <button
                                            onClick={() => setTempSlotData({ ...tempSlotData, duration: 2 })}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${tempSlotData.duration === 2 ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-100 dark:border-slate-600 text-gray-400 dark:text-slate-400'}`}
                                        >
                                            2 Hours
                                        </button>
                                        </div>
                                )}
                            </div>
                        )}
                        
                        {isExternalBusy && (
                            <div className="space-y-3">
                                <Input 
                                    label="Department" 
                                    placeholder="e.g. Mechanical" 
                                    value={tempSlotData.externalDetails?.dept || ''} 
                                    onChange={e => updateExternalDetail('dept', e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input 
                                        label="Semester" 
                                        placeholder="e.g. 5th" 
                                        value={tempSlotData.externalDetails?.semester || ''} 
                                        onChange={e => updateExternalDetail('semester', e.target.value)} 
                                    />
                                    <Input 
                                        label="Subject" 
                                        placeholder="e.g. Thermo" 
                                        value={tempSlotData.externalDetails?.subject || ''} 
                                        onChange={e => updateExternalDetail('subject', e.target.value)} 
                                    />
                                </div>
                            </div>
                        )}

                        {!isExternalBusy && (
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
                                            <div className="flex items-center gap-2 mt-1.5 text-red-500 dark:text-red-400 text-[10px] font-bold animate-pulse ml-1">
                                                <AlertCircle size={10} />
                                                <span>{typeName} hours completed</span>
                                            </div>
                                            );
                                    } else {
                                            return (
                                            <div className="flex items-center gap-2 mt-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold ml-1">
                                                <Clock size={10} />
                                                <span>{remaining} {typeName} hour{remaining !== 1 ? 's' : ''} remaining</span>
                                            </div>
                                            );
                                    }
                                })()}
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">
                                {isExternalBusy ? 'Select Busy Faculties' : 'Assign Faculties'}
                            </label>

                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {(tempSlotData.facultyIds || []).map(fid => {
                                        const fac = schedule.faculties.find(f => f.id === fid);
                                        if (!fac) return null;
                                        return (
                                            <div key={fid} className={`border pl-2.5 pr-1.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 animate-fade-in-up ${isExternalBusy ? 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300' : 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-900/40 text-primary-700 dark:text-primary-300'}`}>
                                                {fac.name} ({fac.initials})
                                                <button 
                                                onClick={() => setTempSlotData(prev => ({ 
                                                    ...prev, 
                                                    facultyIds: prev.facultyIds?.filter(id => id !== fid) 
                                                }))}
                                                className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors ${isExternalBusy ? 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-700' : 'hover:bg-primary-100 dark:hover:bg-primary-900/40 text-primary-400 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-200'}`}
                                                >
                                                    <X size={10} strokeWidth={3} />
                                                </button>
                                            </div>
                                        );
                                })}
                                {(tempSlotData.facultyIds || []).length === 0 && (
                                    <div className="text-gray-400 dark:text-slate-600 text-[10px] font-bold py-1 px-1">No faculty assigned</div>
                                )}
                            </div>

                            <CustomSelect
                                value=""
                                placeholder={isExternalBusy ? "+ Add Busy Faculty" : "+ Add Faculty"}
                                options={facultyOptions}
                                icon={<Plus size={16} strokeWidth={3} />}
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
                                
                            {conflicts && (
                                <div className="space-y-1.5 mt-2">
                                {(tempSlotData.facultyIds || []).map(fid => {
                                    const conflict = conflicts[fid];
                                    if (!conflict) return null;
                                    const fac = schedule.faculties.find(f => f.id === fid);
                                    return (
                                        <div key={fid} className="text-[10px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                            <AlertTriangle size={12} className="shrink-0"/> 
                                            <span>{fac?.initials} is busy in {conflict}</span>
                                        </div>
                                    )
                                })}
                                </div>
                            )}

                                {schedule.faculties.length === 0 && (
                                <div className="text-gray-400 dark:text-slate-600 text-xs italic p-1 mt-1">No faculties added yet.</div>
                            )}
                        </div>
                </div>

                <div className="p-5 pt-1 flex gap-3">
                    {tempSlotData.id && (
                        <button 
                            onClick={onDelete}
                            className="h-11 w-11 shrink-0 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95"
                            title="Delete Slot"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                    <Button 
                        onClick={() => onSave({
                            ...tempSlotData,
                            type: isExternalBusy ? 'Busy' : tempSlotData.type,
                            subjectId: isExternalBusy ? 'external' : tempSlotData.subjectId
                        })}
                        fullWidth 
                        size="md" 
                        disabled={isExternalBusy ? (!tempSlotData.facultyIds || tempSlotData.facultyIds.length === 0) : !tempSlotData.subjectId} 
                        className={`shadow-glow rounded-xl text-sm ${isExternalBusy ? 'bg-slate-700 dark:bg-slate-600' : ''}`}
                    >
                        {tempSlotData.id ? 'Save Changes' : (isExternalBusy ? 'Mark as Busy' : 'Add to Schedule')}
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
};