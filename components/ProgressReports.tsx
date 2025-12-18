import React, { useState, useEffect } from 'react';
import { UserProgress, STORAGE_KEYS, ALPHABET_ITEMS, NUMBER_ITEMS, SIGHT_WORDS, Category, TraceItem } from '../types';

interface ProgressReportsProps {
  existingUsers: string[];
  onClose: () => void;
}

export const ProgressReports: React.FC<ProgressReportsProps> = ({ existingUsers, onClose }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (selectedUser) {
      const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + selectedUser.toLowerCase());
      if (savedProgress) {
        try {
          setUserData(JSON.parse(savedProgress));
        } catch (e) {
          console.error("Failed to load user data", e);
        }
      }
    }
  }, [selectedUser]);

  const calculateStats = (items: TraceItem[], category: Category) => {
    if (!userData) return { completed: 0, total: 0, percent: 0, struggling: [] };

    let completed = 0;
    const struggling: TraceItem[] = [];

    items.forEach(item => {
      const count = userData.progress[item.id] || 0;
      const mistakes = userData.mistakes?.[item.id] || 0;

      if (count >= item.requiredTraces) {
        completed++;
      } else if (mistakes > 0 || count > 0) {
        // If they have started but not finished, or have made mistakes, they need practice
        struggling.push(item);
      }
    });

    return {
      completed,
      total: items.length,
      percent: Math.round((completed / items.length) * 100),
      struggling
    };
  };

  const renderProgressBar = (label: string, stats: any, color: string) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
      <div className="flex justify-between items-end mb-2">
        <h3 className="font-bold text-gray-700 text-lg">{label}</h3>
        <span className="text-2xl font-bold" style={{ color }}>{stats.percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div 
          className="h-4 rounded-full transition-all duration-1000"
          style={{ width: `${stats.percent}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-gray-400 text-sm mt-2">{stats.completed} / {stats.total} mastered</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={selectedUser ? () => setSelectedUser(null) : onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800 font-hand">
            {selectedUser ? `${selectedUser}'s Report` : 'Progress Reports'}
          </h1>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto w-full flex-1">
        {!selectedUser ? (
          // User List View
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {existingUsers.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 mt-10">No students registered yet.</p>
            ) : (
              existingUsers.map(user => (
                <button
                  key={user}
                  onClick={() => setSelectedUser(user)}
                  className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center font-bold text-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    {user.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{user}</h3>
                    <p className="text-sm text-gray-500">View Report &rarr;</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          // Detail View
          <div className="space-y-6">
            {userData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderProgressBar('Alphabet', calculateStats(ALPHABET_ITEMS, Category.ALPHABET), '#3B82F6')}
                  {renderProgressBar('Numbers', calculateStats(NUMBER_ITEMS, Category.NUMBERS), '#10B981')}
                  {renderProgressBar('Sight Words', calculateStats(SIGHT_WORDS, Category.SIGHT_WORDS), '#8B5CF6')}
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Needs Practice
                  </h3>
                  
                  {(() => {
                    const abcStats = calculateStats(ALPHABET_ITEMS, Category.ALPHABET);
                    const numStats = calculateStats(NUMBER_ITEMS, Category.NUMBERS);
                    const wordStats = calculateStats(SIGHT_WORDS, Category.SIGHT_WORDS);
                    const allStruggling = [...abcStats.struggling, ...numStats.struggling, ...wordStats.struggling];

                    if (allStruggling.length === 0) {
                       return (
                         <div className="text-center py-8">
                           <p className="text-gray-500 text-lg">Great job! No items flagged for review yet.</p>
                           <p className="text-sm text-gray-400">Keep practicing new items!</p>
                         </div>
                       );
                    }

                    return (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {allStruggling.map(item => (
                          <div key={item.id} className="aspect-square bg-orange-50 rounded-xl flex flex-col items-center justify-center border border-orange-100">
                             <span className="font-bold text-2xl text-orange-600">{item.label}</span>
                             <span className="text-xs text-orange-400 font-medium">Practicing</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};