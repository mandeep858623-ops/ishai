import React from 'react';
import { CATEGORIES_LIST, NewsCategoryId } from './NewsTypes';

interface NewsCategoryBarProps {
  selectedCategory: NewsCategoryId;
  onSelectCategory: (category: NewsCategoryId) => void;
  activeCounts?: Record<string, number>;
}

export const NewsCategoryBar: React.FC<NewsCategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  activeCounts = {},
}) => {
  return (
    <div className="bg-[#05070a] border-b border-zinc-800/80 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 shrink-0 select-none text-xs">
      {CATEGORIES_LIST.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        const count = activeCounts[cat.id];

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
              isSelected
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-950 scale-102 font-extrabold'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <span>{cat.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  isSelected ? 'bg-black text-cyan-300 font-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
