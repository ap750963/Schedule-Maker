import React, { useEffect, useState } from 'react';
import { X, Trash2, ChevronDown, Palette, AlertCircle, Clock, Plus, AlertTriangle, Edit2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { TimeSlot, Subject, Faculty, SUBJECT_COLORS, Schedule } from '../../types';
import { getColorClasses, getSubjectColorName } from '../../utils';

interface ClassModalProps {
  data: Partial<TimeSlot>;
  schedule: Schedule; // Needed for subjects, faculties, and conflict checks within self
  day: string;
  periodLabel?: string;
  onClose: () => void;
  onSave: (data: Partial<TimeSlot>) => void;
  onDelete: () => void;
  // Optional: Used by Master Editor
  conflicts?: Record<string, string>; // facultyId -> conflict string
  onCheckConflict?: (facultyId: string) => string | null;
}

export const ClassModal: React.FC<ClassModalProps> = ({ 
  data, schedule, day, periodLabel, onClose, onSave, onDelete, conflicts 
}) => {
  const [tempSlotData, setTempSlotData] = useState<Partial<TimeSlot>>(data);

  // Helper to get usage stats for the current schedule
  const getSubjectUsage = (subject: Subject) => {
    // Exclude current slot if we are editing it to avoid double counting
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/10 backdrop-blur-sm transition-all" onClick={onClose}>
        <div 
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up border border-gray-100" 
            onClick={e => e.stopPropagation()}
        >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                        {tempSlotData.subjectId ? 'Edit Class' : 'Add Class'}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            {day}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold font-mono">
                            {periodLabel}
                        </span>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="h-10 w-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>
            </div>
            
            <div className="p-8 space-y-6">
                    {/* Type Toggle */}
                    <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Class Type</label>
                    <div className="bg-gray-100 p-1.5 rounded-[1.5rem] flex relative">
                        <button 
                            className={`flex-1 py-4 text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${tempSlotData.type === 'Theory' ? 'bg-white text-orange-500 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={() => setTempSlotData({ ...tempSlotData, type: 'Theory', facultyIds: [], duration: 1 })}
                        >
                            <div className={`h-2 w-2 rounded-full ${tempSlotData.type === 'Theory' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                            Theory
                        </button>
                        <button 
                            className={`flex-1 py-4 text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${tempSlotData.type === 'Practical' ? 'bg-white text-green-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={() => {
                                setTempSlotData({ ...tempSlotData, type: 'Practical', facultyIds: [] });
                            }}
                        >
                            <div className={`h-2 w-2 rounded-full ${tempSlotData.type === 'Practical' ? 'bg-green-500' : 'bg-gray-300'}`} />
                            Lab
                        </button>
                    </div>
                    
                    {/* Duration Selector for Practical */}
                    {tempSlotData.type === 'Practical' && (
                            <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => setTempSlotData({ ...tempSlotData, duration: 1 })}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${tempSlotData.duration === 1 ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'}`}
                            >
                                1 Hour
                            </button>
                            <button
                                onClick={() => setTempSlotData({ ...tempSlotData, duration: 2 })}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${tempSlotData.duration === 2 ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'}`}
                            >
                                2 Hours
                            </button>
                            </div>
                    )}
                </div>

                {/* Subject Select */}
                <div className="group relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Subject</label>
                    <div className="relative">
                        <select 
                            className="w-full rounded-2xl border-2 border-gray-100 bg-white hover:border-primary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 py-4 pl-5 pr-12 text-gray-900 font-bold text-lg appearance-none transition-all outline-none disabled:bg-gray-50"
                            value={tempSlotData.subjectId || ''}
                            onChange={(e) => setTempSlotData({ ...tempSlotData, subjectId: e.target.value })}
                        >
                            <option value="" disabled>Select Subject</option>
                            {schedule.subjects.map(s => {
                                const stats = getSubjectUsage(s);
                                const isFull = tempSlotData.type === 'Theory' ? stats.isTheoryFull : stats.isPracticalFull;
                                const isCurrent = tempSlotData.subjectId === s.id;
                                
                                return (
                                    <option 
                                        key={s.id} 
                                        value={s.id} 
                                        disabled={!isCurrent && isFull}
                                        className={(!isCurrent && isFull) ? "text-gray-300" : ""}
                                    >
                                        {s.name} ({s.code})
                                    </option>
                                );
                            })}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown size={20} strokeWidth={3} />
                        </div>
                    </div>
                    
                    {/* Subject Color Picker (Only show if onSave handles updates to subjects, which we might not do here to keep it simple, but we can display color) */}
                    {/* For simplicity in this refactor, we are skipping color updating here to keep props simple, or we assume subject color is fixed in wizard. 
                        If we want to update color, we need a callback. 
                    */}

                        {/* Quota Message */}
                        {tempSlotData.subjectId && currentSubject && (() => {
                        const stats = getSubjectUsage(currentSubject);
                        const isFull = tempSlotData.type === 'Theory' ? stats.isTheoryFull : stats.isPracticalFull;
                        const remaining = tempSlotData.type === 'Theory' ? stats.theoryRemaining : stats.practicalRemaining;
                        const typeName = tempSlotData.type === 'Theory' ? 'Theory' : 'Practical';
                        
                        if (isFull) {
                                return (
                                <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-bold animate-pulse">
                                    <AlertCircle size={12} />
                                    <span>{typeName} hours completed for {currentSubject.name}</span>
                                </div>
                                );
                        } else {
                                return (
                                <div className="flex items-center gap-2 mt-2 text-emerald-600 text-xs font-bold">
                                    <Clock size={12} />
                                    <span>{remaining} {typeName} hour{remaining !== 1 ? 's' : ''} remaining</span>
                                </div>
                                );
                        }
                    })()}
                </div>

                {/* Faculty Select (Multi) */}
                <div className="group relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                        Assign Faculties
                    </label>

                    {/* Selected Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(tempSlotData.facultyIds || []).map(fid => {
                                const fac = schedule.faculties.find(f => f.id === fid);
                                if (!fac) return null;
                                return (
                                    <div key={fid} className="bg-primary-50 border border-primary-100 text-primary-700 pl-3 pr-2 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in-up">
                                        {fac.name} ({fac.initials})
                                        <button 
                                        onClick={() => setTempSlotData(prev => ({ 
                                            ...prev, 
                                            facultyIds: prev.facultyIds?.filter(id => id !== fid) 
                                        }))}
                                        className="h-5 w-5 rounded-full hover:bg-primary-100 flex items-center justify-center transition-colors text-primary-400 hover:text-primary-700"
                                        >
                                            <X size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                );
                        })}
                        {(tempSlotData.facultyIds || []).length === 0 && (
                            <div className="text-gray-400 text-xs font-bold py-2 px-1">No faculty assigned</div>
                        )}
                    </div>

                    <div className="relative">
                        <select 
                            className="w-full rounded-2xl border-2 border-gray-100 bg-white hover:border-primary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 py-4 pl-5 pr-12 text-gray-900 font-bold text-lg appearance-none transition-all outline-none disabled:bg-gray-50"
                            value=""
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                setTempSlotData(prev => {
                                    const current = prev.facultyIds || [];
                                    if (current.includes(val)) return prev;
                                    return { ...prev, facultyIds: [...current, val] };
                                });
                            }}
                        >
                            <option value="">+ Add Faculty</option>
                            {schedule.faculties.map(f => {
                                const isSelected = tempSlotData.facultyIds?.includes(f.id);
                                const conflict = conflicts ? conflicts[f.id] : null;
                                if (isSelected) return null;
                                return (
                                    <option key={f.id} value={f.id}>
                                        {f.name} ({f.initials}) {conflict ? '(Busy)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <Plus size={20} strokeWidth={3} />
                        </div>
                    </div>
                        
                    {/* Conflict Messages */}
                    {conflicts && (
                        <div className="space-y-2 mt-3">
                        {(tempSlotData.facultyIds || []).map(fid => {
                            const conflict = conflicts[fid];
                            if (!conflict) return null;
                            const fac = schedule.faculties.find(f => f.id === fid);
                            return (
                                <div key={fid} className="text-xs font-bold text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                                    <AlertTriangle size={14} className="shrink-0"/> 
                                    <span>{fac?.initials} is busy in {conflict}</span>
                                </div>
                            )
                        })}
                        </div>
                    )}

                        {schedule.faculties.length === 0 && (
                        <div className="text-gray-400 text-sm italic p-2 mt-1">No faculties added yet.</div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-8 pt-2 flex gap-4">
                {tempSlotData.id && (
                    <button 
                        onClick={onDelete}
                        className="h-14 w-14 shrink-0 bg-red-50 text-red-500 border border-red-100 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95"
                        title="Delete Class"
                    >
                        <Trash2 size={24} />
                    </button>
                )}
                <Button 
                    onClick={() => onSave(tempSlotData)}
                    fullWidth 
                    size="lg" 
                    disabled={!tempSlotData.subjectId || !tempSlotData.facultyIds?.length} 
                    className="shadow-glow rounded-2xl text-lg"
                >
                    {tempSlotData.id ? 'Save Changes' : 'Add to Schedule'}
                </Button>
            </div>
        </div>
    </div>
  );
};