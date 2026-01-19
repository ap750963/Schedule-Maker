import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Period } from '../../types';
import { to24Hour } from '../../utils';

interface PeriodModalProps {
  period: Period;
  onSave: (updatedPeriod: Period, startTime: string, endTime: string) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

export const PeriodModal: React.FC<PeriodModalProps> = ({ period, onSave, onDelete, onClose }) => {
  const [times, setTimes] = useState({ start: '', end: '' });
  const [localPeriod, setLocalPeriod] = useState<Period>(period);

  useEffect(() => {
    const [startStr, endStr] = (period.time || '09:00 - 10:00').split('-').map(s => s.trim());
    setTimes({
      start: to24Hour(startStr) || '09:00',
      end: to24Hour(endStr) || '10:00'
    });
    setLocalPeriod(period);
  }, [period]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/10 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-3xl shadow-2xl p-5 space-y-3 border border-gray-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">
          {localPeriod.id === 0 ? 'Add Time Slot' : 'Edit Time Slot'}
        </h3>

        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl">
          <span className="text-xs font-bold text-gray-600 dark:text-slate-300 ml-1">Set as Recess/Break</span>
          <button
            onClick={() => setLocalPeriod({ ...localPeriod, isBreak: !localPeriod.isBreak })}
            className={`w-10 h-6 rounded-full transition-colors relative ${localPeriod.isBreak ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'}`}
          >
            <div className={`h-4 w-4 bg-white rounded-full absolute top-1 transition-all ${localPeriod.isBreak ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        {!localPeriod.isBreak && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 block ml-1">Start Time</label>
              <input
                type="time"
                className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-gray-900 dark:text-white text-sm outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
                value={times.start}
                onChange={e => setTimes({ ...times, start: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 block ml-1">End Time</label>
              <input
                type="time"
                className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-gray-900 dark:text-white text-sm outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
                value={times.end}
                onChange={e => setTimes({ ...times, end: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-3">
          {localPeriod.id !== 0 && (
            <button
              onClick={() => onDelete(localPeriod.id)}
              className="h-10 w-10 shrink-0 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Delete Time Slot"
            >
              <Trash2 size={18} />
            </button>
          )}
          <Button onClick={() => onSave(localPeriod, times.start, times.end)} fullWidth className="rounded-xl" size="md">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};