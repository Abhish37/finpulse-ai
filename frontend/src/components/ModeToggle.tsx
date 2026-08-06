'use client';
import React from 'react';
import { BookOpen } from 'lucide-react';

interface ModeProps {
  isLaymanMode: boolean;
  setIsLaymanMode: (val: boolean) => void;
}

export const ModeToggle = ({ isLaymanMode, setIsLaymanMode }: ModeProps) => {
  return (
    <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 p-1 rounded-lg">
      <button
        onClick={() => setIsLaymanMode(false)}
        className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
          !isLaymanMode ? 'bg-white text-blue-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-700 font-medium'
        }`}
      >
        Terminal Mode
      </button>
      <button
        onClick={() => setIsLaymanMode(true)}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
          isLaymanMode ? 'bg-white border-emerald-200 text-emerald-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-700 font-medium'
        }`}
      >
        <BookOpen className="w-3 h-3 mr-1" />
        Plain English
      </button>
    </div>
  );
};
