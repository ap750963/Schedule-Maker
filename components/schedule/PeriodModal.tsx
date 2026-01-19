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
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 space-y-4 border border-gray-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-black text-gray-900 dark:text-white">
          {localPeriod.id === 0 ? 'Add Time Slot' : 'Edit Time Slot'}
        </h3>

        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-2xl">
          <span className="text-sm font-bold text-gray-600 dark:text-slate-300 ml-2">Set as Recess/Break</span>
          <button
            onClick={() => setLocalPeriod({ ...localPeriod, isBreak: !localPeriod.isBreak })}
            className={`w-12 h-7 rounded-full transition-colors relative ${localPeriod.isBreak ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'}`}
          >
            <div className={`h-5 w-5 bg-white rounded-full absolute top-1 transition-all ${localPeriod.isBreak ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        {!localPeriod.isBreak && (
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block ml-1">Start Time</label>
              <input
                type="time"
                className="w-full bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-gray-900 dark:text-white outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
                value={times.start}
                onChange={e => setTimes({ ...times, start: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block ml-1">End Time</label>
              <input
                type="time"
                className="w-full bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-gray-900 dark:text-white outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
                value={times.end}
                onChange={e => setTimes({ ...times, end: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          {localPeriod.id !== 0 && (
            <button
              onClick={() => onDelete(localPeriod.id)}
              className="h-12 w-12 shrink-0 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Delete Time Slot"
            >
              <Trash2 size={20} />
            </button>
          )}
          <Button onClick={() => onSave(localPeriod, times.start, times.end)} fullWidth className="rounded-2xl">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};