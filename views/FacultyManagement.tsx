import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, User, UserPlus, Search, X } from 'lucide-react';
import { Faculty } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { generateId, generateInitials } from '../utils';

interface FacultyManagementProps {
  faculties: Faculty[];
  onSave: (faculties: Faculty[]) => void;
  onBack: () => void;
}

export const FacultyManagement: React.FC<FacultyManagementProps> = ({ faculties, onSave, onBack }) => {
  const [localFaculties, setLocalFaculties] = useState<Faculty[]>(faculties);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInitials, setNewInitials] = useState('');

  const handleOpenModal = () => {
    setNewName('');
    setNewInitials('');
    setIsAddModalOpen(true);
  };

  const handleSaveNewFaculty = () => {
    if (!newName.trim()) return;
    
    const newFac: Faculty = { 
      id: generateId(), 
      name: newName.trim(), 
      initials: (newInitials || generateInitials(newName)).toUpperCase().substring(0, 3)
    };
    
    const updated = [...localFaculties, newFac];
    setLocalFaculties(updated);
    onSave(updated);
    setIsAddModalOpen(false);
  };

  const handleUpdate = (id: string, name: string) => {
    const updated = localFaculties.map(f => f.id === id ? { ...f, name, initials: generateInitials(name) } : f);
    setLocalFaculties(updated);
    onSave(updated);
  };

  const handleDelete = (id: string) => {
    const updated = localFaculties.filter(f => f.id !== id);
    setLocalFaculties(updated);
    onSave(updated);
  };

  const filtered = localFaculties.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.initials.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 dark:bg-primary-900/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="px-6 py-6 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="h-10 w-10 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 hover:text-primary-600 transition-colors shadow-sm">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black dark:text-white">Global Faculty</h1>
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            {localFaculties.length} Total
          </div>
      </div>

      <div className="p-6 overflow-y-auto pb-40">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative mb-8">
            <Input 
                placeholder="Search faculty by name or initials..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                icon={<Search size={20} />}
                className="shadow-sm"
            />
          </div>

          <div className="grid gap-3">
            {filtered.map(f => (
                <div key={f.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-card border border-gray-100 dark:border-slate-700/50 flex items-center gap-4 transition-all hover:shadow-soft group animate-fade-in-up">
                    <div className="h-12 w-12 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center font-black text-primary-700 dark:text-primary-300 shadow-sm border border-primary-100/50 dark:border-primary-900/50">
                        {f.initials}
                    </div>
                    <div className="flex-1">
                        <input 
                            className="w-full bg-transparent border-none font-bold text-gray-900 dark:text-white focus:ring-0 p-0 text-sm"
                            value={f.name}
                            onChange={e => handleUpdate(f.id, e.target.value)}
                            placeholder="Faculty Name"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest">Initials: {f.initials}</span>
                        </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(f.id)} 
                      className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Delete Faculty"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
            
            {filtered.length === 0 && (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
                    <User size={48} className="mx-auto text-gray-200 dark:text-slate-700 mb-4" />
                    <p className="text-gray-400 dark:text-slate-500 font-bold">No results found for "{searchQuery}"</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={handleOpenModal}
        className="fixed bottom-8 right-8 h-16 w-16 bg-primary-600 text-white rounded-full shadow-glow flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60]"
        title="Add New Faculty"
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>

      {/* Add Faculty Bottom Sheet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsAddModalOpen(false)}>
            <div 
              className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-[3rem] shadow-2xl p-8 pt-6 animate-fade-in-up origin-bottom border-t border-white/20" 
              onClick={e => e.stopPropagation()}
            >
                {/* Modal Handle */}
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-8" />
                
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add New Faculty</h3>
                        <p className="text-sm text-gray-400 dark:text-slate-500 font-medium">Enter details to add to college registry.</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-50 dark:bg-slate-700 rounded-full text-gray-400 hover:text-primary-600 transition-colors">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="space-y-6">
                    <Input 
                        label="Full Name" 
                        placeholder="e.g. Dr. Jane Doe" 
                        value={newName} 
                        onChange={e => {
                          setNewName(e.target.value);
                          // Auto-generate initials as you type if the initials field is empty or matching the current name's initials
                          if (!newInitials || newInitials === generateInitials(newName.slice(0, -1))) {
                            setNewInitials(generateInitials(e.target.value));
                          }
                        }}
                        icon={<User size={20} />}
                        autoFocus
                    />
                    
                    <div className="w-1/2">
                        <Input 
                            label="Initials" 
                            placeholder="e.g. JD" 
                            value={newInitials} 
                            maxLength={3}
                            onChange={e => setNewInitials(e.target.value.toUpperCase())}
                        />
                    </div>

                    <div className="pt-4 pb-2">
                        <Button 
                          onClick={handleSaveNewFaculty} 
                          fullWidth 
                          size="lg" 
                          disabled={!newName.trim()}
                          className="shadow-glow py-4 rounded-2xl text-lg"
                          icon={<UserPlus size={20} />}
                        >
                            Save Faculty Member
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
