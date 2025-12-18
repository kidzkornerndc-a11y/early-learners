import React from 'react';
import { Category, TraceItem, UserProgress, ALPHABET_ITEMS, NUMBER_ITEMS, SIGHT_WORDS } from '../types';

interface DashboardProps {
  progress: UserProgress;
  onSelectItem: (item: TraceItem) => void;
  onLogout: () => void;
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  progress, 
  onSelectItem, 
  onLogout,
  activeCategory,
  onCategoryChange
}) => {
  const getItems = () => {
    switch (activeCategory) {
      case Category.ALPHABET: return ALPHABET_ITEMS;
      case Category.NUMBERS: return NUMBER_ITEMS;
      case Category.SIGHT_WORDS: return SIGHT_WORDS;
    }
  };

  const isLocked = (index: number) => {
    if (index === 0) return false;
    const items = getItems();
    const prevItem = items[index - 1];
    const prevProgress = progress.progress[prevItem.id] || 0;
    return prevProgress < prevItem.requiredTraces;
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
             {progress.name.charAt(0).toUpperCase()}
           </div>
           <span className="font-bold text-gray-700 text-lg hidden sm:block">Hi, {progress.name}!</span>
        </div>
        <button 
          onClick={onLogout}
          className="text-red-400 font-bold hover:text-red-600 px-4"
        >
          Exit
        </button>
      </header>

      <div className="flex justify-center gap-2 p-4 bg-white/50 backdrop-blur-sm sticky top-20 z-10">
        <button
          onClick={() => onCategoryChange(Category.ALPHABET)}
          className={`px-6 py-2 rounded-full font-bold transition-all ${activeCategory === Category.ALPHABET ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-blue-100 text-blue-600'}`}
        >
          ABC
        </button>
        <button
          onClick={() => onCategoryChange(Category.NUMBERS)}
          className={`px-6 py-2 rounded-full font-bold transition-all ${activeCategory === Category.NUMBERS ? 'bg-green-500 text-white shadow-md scale-105' : 'bg-green-100 text-green-600'}`}
        >
          123
        </button>
        <button
          onClick={() => onCategoryChange(Category.SIGHT_WORDS)}
          className={`px-6 py-2 rounded-full font-bold transition-all ${activeCategory === Category.SIGHT_WORDS ? 'bg-purple-500 text-white shadow-md scale-105' : 'bg-purple-100 text-purple-600'}`}
        >
          Sight Words
        </button>
      </div>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {getItems().map((item, index) => {
            const locked = isLocked(index);
            const currentCount = progress.progress[item.id] || 0;
            const isComplete = currentCount >= item.requiredTraces;

            return (
              <button
                key={item.id}
                onClick={() => !locked && onSelectItem(item)}
                disabled={locked}
                className={`
                  aspect-square rounded-3xl flex flex-col items-center justify-center relative
                  transition-all duration-300 border-b-4
                  ${locked 
                    ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-70' 
                    : isComplete
                      ? 'bg-green-100 border-green-300 text-green-700 hover:scale-105 active:scale-95'
                      : 'bg-white border-blue-200 text-blue-600 hover:border-blue-400 hover:scale-105 active:scale-95 shadow-sm'
                  }
                `}
              >
                {locked && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                )}
                
                <span className={`font-bold ${item.category === Category.SIGHT_WORDS ? 'text-2xl' : 'text-5xl'}`}>
                  {item.label}
                </span>

                {!locked && (
                  <div className="flex gap-1 mt-2">
                    {[...Array(item.requiredTraces)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full ${i < currentCount ? 'bg-yellow-400' : 'bg-gray-200'}`} 
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};