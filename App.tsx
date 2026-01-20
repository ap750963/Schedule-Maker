import React, { useState, useEffect, useCallback } from 'react';
import { Schedule, ViewState } from './types.ts';
import { Home } from './views/Home.tsx';
import { Wizard } from './views/Wizard.tsx';
import { Editor } from './views/Editor.tsx';
import { MultiSemesterEditor } from './views/MultiSemesterEditor.tsx';
import { FacultyWiseView } from './views/FacultyWiseView.tsx';
import { applyTheme } from './utils/index.ts';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('scholarTime_theme') || 'teal');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('scholarTime_darkMode') === 'true');

  // Load Schedules
  useEffect(() => {
    const saved = localStorage.getItem('scholarTime_schedules');
    if (saved) {
      try {
        setSchedules(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse schedules", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scholarTime_schedules', JSON.stringify(schedules));
  }, [schedules]);

  // Theme Effects
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('scholarTime_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('scholarTime_darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const handleCreateNew = () => setView('wizard');

  const handleFinishWizard = (newSchedules: Schedule[]) => {
    setSchedules(prev => [...newSchedules, ...prev]);
    if (newSchedules.length > 0) {
        setView('master-editor');
    } else {
        setView('dashboard');
    }
  };

  const handleSelectSchedule = (id: string) => {
    setActiveScheduleId(id);
    setView('editor');
  };

  const handleDeleteSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    if (activeScheduleId === id) {
      setActiveScheduleId(null);
      setView('dashboard');
    }
  }, [activeScheduleId]);

  const handleUpdateSchedule = (updated: Schedule) => {
    setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleUpdateAllSchedules = (updatedSchedules: Schedule[]) => {
      setSchedules(prev => {
          const map = new Map(prev.map(s => [s.id, s]));
          updatedSchedules.forEach(s => map.set(s.id, s));
          return Array.from(map.values());
      });
      setView('dashboard');
  };

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);

  return (
    <div className="h-full w-full">
      {view === 'dashboard' && (
        <Home 
          schedules={schedules} 
          onCreateNew={handleCreateNew} 
          onSelectSchedule={handleSelectSchedule}
          onOpenMaster={() => setView('master-editor')}
          onOpenFacultyWise={() => setView('faculty-wise')}
          onDeleteSchedule={handleDeleteSchedule}
          currentTheme={theme}
          isDarkMode={isDarkMode}
          onSetTheme={setTheme}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      )}
      
      {view === 'wizard' && (
        <Wizard onCancel={() => setView('dashboard')} onFinish={handleFinishWizard} />
      )}
      
      {view === 'editor' && activeSchedule && (
        <Editor 
          schedule={activeSchedule} 
          allSchedules={schedules}
          onSave={handleUpdateSchedule} 
          onBack={() => setView('dashboard')} 
        />
      )}

      {view === 'master-editor' && (
        <MultiSemesterEditor schedules={schedules} onSaveAll={handleUpdateAllSchedules} onBack={() => setView('dashboard')} />
      )}

      {view === 'faculty-wise' && (
        <FacultyWiseView schedules={schedules} onBack={() => setView('dashboard')} />
      )}

      {view === 'editor' && !activeSchedule && (
        <div className="flex items-center justify-center h-screen dark:bg-slate-900 dark:text-white">
            <p>Error: Schedule not found.</p>
            <button onClick={() => setView('dashboard')} className="ml-4 text-blue-600 underline">Go Home</button>
        </div>
      )}
    </div>
  );
};

export default App;