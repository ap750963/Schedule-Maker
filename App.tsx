import React, { useState, useEffect, useCallback } from 'react';
import { Schedule, ViewState, Faculty } from './types.ts';
import { Home } from './views/Home.tsx';
import { Wizard } from './views/Wizard.tsx';
import { Editor } from './views/Editor.tsx';
import { MultiSemesterEditor } from './views/MultiSemesterEditor.tsx';
import { FacultyWiseView } from './views/FacultyWiseView.tsx';
import { FacultyManagement } from './views/FacultyManagement.tsx';
import { applyTheme } from './utils/index.ts';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [globalFaculties, setGlobalFaculties] = useState<Faculty[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('scholarTime_theme') || 'teal');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('scholarTime_darkMode') === 'true');

  // Load Schedules and Global Faculties
  useEffect(() => {
    const savedSchedules = localStorage.getItem('scholarTime_schedules');
    if (savedSchedules) {
      try { setSchedules(JSON.parse(savedSchedules)); } catch (e) { console.error(e); }
    }
    const savedFaculties = localStorage.getItem('scholarTime_faculties');
    if (savedFaculties) {
      try { setGlobalFaculties(JSON.parse(savedFaculties)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scholarTime_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('scholarTime_faculties', JSON.stringify(globalFaculties));
  }, [globalFaculties]);

  // Theme Effects
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('scholarTime_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('scholarTime_darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const handleFinishWizard = (newSchedules: Schedule[]) => {
    setSchedules(prev => [...newSchedules, ...prev]);
    if (newSchedules.length > 0) {
        setView('master-editor');
    } else {
        setView('dashboard');
    }
  };

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
          onCreateNew={() => setView('wizard')} 
          onSelectSchedule={(id) => { setActiveScheduleId(id); setView('editor'); }}
          onOpenMaster={() => setView('master-editor')}
          onOpenFacultyWise={() => setView('faculty-wise')}
          onOpenFacultyManagement={() => setView('faculty-management')}
          onDeleteSchedule={(id) => setSchedules(prev => prev.filter(s => s.id !== id))}
          currentTheme={theme}
          isDarkMode={isDarkMode}
          onSetTheme={setTheme}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      )}
      
      {view === 'wizard' && (
        <Wizard 
          onCancel={() => setView('dashboard')} 
          onFinish={handleFinishWizard} 
          globalFaculties={globalFaculties}
        />
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
        <MultiSemesterEditor 
          schedules={schedules} 
          onSaveAll={handleUpdateAllSchedules} 
          onBack={() => setView('dashboard')} 
        />
      )}

      {view === 'faculty-wise' && (
        <FacultyWiseView schedules={schedules} onBack={() => setView('dashboard')} />
      )}

      {view === 'faculty-management' && (
        <FacultyManagement 
          faculties={globalFaculties} 
          onSave={setGlobalFaculties} 
          onBack={() => setView('dashboard')} 
        />
      )}
    </div>
  );
};

export default App;
