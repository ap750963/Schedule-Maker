import React, { useState, useEffect } from 'react';
import { Schedule, ViewState } from './types';
import { Home } from './views/Home';
import { Wizard } from './views/Wizard';
import { Editor } from './views/Editor';
import { MultiSemesterEditor } from './views/MultiSemesterEditor';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  
  // State to track which set of schedules to show in master view (e.g., active session)
  const [masterViewFilter, setMasterViewFilter] = useState<{session?: string, className?: string} | null>(null);

  // Load from LocalStorage
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

  // Save to LocalStorage whenever schedules change
  useEffect(() => {
    localStorage.setItem('scholarTime_schedules', JSON.stringify(schedules));
  }, [schedules]);

  const handleCreateNew = () => {
    setView('wizard');
  };

  const handleFinishWizard = (newSchedules: Schedule[]) => {
    setSchedules(prev => [...newSchedules, ...prev]);
    
    // Set filter for master view to show these new schedules
    if (newSchedules.length > 0) {
        setMasterViewFilter({
            session: newSchedules[0].details.session,
            className: newSchedules[0].details.className
        });
        setView('master-editor');
    } else {
        setView('dashboard');
    }
  };

  const handleSelectSchedule = (id: string) => {
    setActiveScheduleId(id);
    setView('editor');
  };

  const handleDeleteSchedule = (id: string) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      setSchedules(prev => prev.filter(s => s.id !== id));
      if (activeScheduleId === id) {
        setActiveScheduleId(null);
        setView('dashboard');
      }
    }
  };

  const handleUpdateSchedule = (updated: Schedule) => {
    setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleUpdateAllSchedules = (updatedSchedules: Schedule[]) => {
      // Merge updated schedules back into main state
      setSchedules(prev => {
          const map = new Map(prev.map(s => [s.id, s]));
          updatedSchedules.forEach(s => map.set(s.id, s));
          return Array.from(map.values());
      });
      // Navigate back to dashboard to provide feedback that save worked
      setView('dashboard');
  };

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);

  // Filter schedules for master view
  const masterSchedules = masterViewFilter 
    ? schedules.filter(s => 
        (!masterViewFilter.session || s.details.session === masterViewFilter.session) &&
        (!masterViewFilter.className || s.details.className === masterViewFilter.className)
      )
    : schedules;

  // Fallback: if no specific filter but user navigated to master-editor, just show the most recent session's
  const effectiveMasterSchedules = masterSchedules.length > 0 ? masterSchedules : schedules;

  return (
    <div className="h-full w-full">
      {view === 'dashboard' && (
        <Home 
          schedules={schedules} 
          onCreateNew={handleCreateNew} 
          onSelectSchedule={handleSelectSchedule}
          onOpenMaster={() => {
              setMasterViewFilter(null); // Clear filter to show all or let Home logic decide later
              setView('master-editor');
          }}
          onDeleteSchedule={handleDeleteSchedule}
        />
      )}
      
      {view === 'wizard' && (
        <Wizard 
          onCancel={() => setView('dashboard')} 
          onFinish={handleFinishWizard} 
        />
      )}
      
      {view === 'editor' && activeSchedule && (
        <Editor 
          schedule={activeSchedule} 
          onSave={handleUpdateSchedule} 
          onBack={() => setView('dashboard')} 
        />
      )}

      {view === 'master-editor' && (
        <MultiSemesterEditor
            schedules={effectiveMasterSchedules}
            onSaveAll={handleUpdateAllSchedules}
            onBack={() => setView('dashboard')}
        />
      )}

      {/* Fallback if in editor mode but schedule not found (e.g. deleted) */}
      {view === 'editor' && !activeSchedule && (
        <div className="flex items-center justify-center h-screen">
            <p>Error: Schedule not found.</p>
            <button onClick={() => setView('dashboard')} className="ml-4 text-blue-600 underline">Go Home</button>
        </div>
      )}
    </div>
  );
};

export default App;