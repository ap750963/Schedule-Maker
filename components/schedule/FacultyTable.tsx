import React from 'react';
import { Clock } from 'lucide-react';
import { Faculty } from '../../types';

interface FacultyStats extends Faculty {
  totalDuration: number;
}

interface FacultyTableProps {
  stats: FacultyStats[];
}

export const FacultyTable: React.FC<FacultyTableProps> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-soft border border-gray-100 dark:border-slate-700 p-6 w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Clock size={20} strokeWidth={2.5} />
        </div>
        <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white leading-none">Faculty Workload</h3>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">Weekly load monitoring</p>
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700">
              <th className="py-3 px-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Member</th>
              <th className="py-3 px-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">ID</th>
              <th className="py-3 px-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Hours</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((fac) => (
              <tr key={fac.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="py-3 px-4 font-black text-sm text-gray-700 dark:text-slate-200">{fac.name}</td>
                <td className="py-3 px-4 font-mono text-xs font-black text-gray-400 dark:text-slate-500 text-center">{fac.initials}</td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-black text-xs">
                    {fac.totalDuration}h
                  </span>
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-300 dark:text-slate-600 font-black text-xs italic">No data recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};