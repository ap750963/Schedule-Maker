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
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-card border border-gray-100 dark:border-slate-700 p-6 max-w-2xl w-full ml-0 mr-auto mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Clock size={20} strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">Faculty Workload</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700">
              <th className="py-3 px-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Faculty Name</th>
              <th className="py-3 px-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Initials</th>
              <th className="py-3 px-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Hours</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((fac) => (
              <tr key={fac.id} className="border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="py-3 px-4 font-bold text-gray-700 dark:text-slate-200">{fac.name}</td>
                <td className="py-3 px-4 font-mono text-sm text-gray-500 dark:text-slate-400 text-center">{fac.initials}</td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold text-sm">
                    {fac.totalDuration} hrs
                  </span>
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-400 dark:text-slate-600 italic">No faculty hours recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};