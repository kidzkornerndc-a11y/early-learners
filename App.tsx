import React, { useState, useEffect } from 'react';
import { Welcome } from './components/Welcome';
import { Dashboard } from './components/Dashboard';
import { TracingCanvas } from './components/TracingCanvas';
import { ProgressReports } from './components/ProgressReports';
import { AppScreen, UserProgress, TraceItem, STORAGE_KEYS, Category } from './types';
import { speakText, preloadText } from './services/geminiService';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.WELCOME);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [activeItem, setActiveItem] = useState<TraceItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>(Category.ALPHABET);
  const [existingUsers, setExistingUsers] = useState<string[]>([]);
  const [appLogo, setAppLogo] = useState<string>('https://picsum.photos/200/200');

  // Load users list and logo on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
    if (savedUsers) {
      try {
        setExistingUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Failed to load users list", e);
      }
    }

    const savedLogo = localStorage.getItem(STORAGE_KEYS.APP_LOGO);
    if (savedLogo) {
      setAppLogo(savedLogo);
    }
    
    // Preload generic feedback
    preloadText("Good job! Do it one more time!");
    preloadText("Amazing job! You finished!");
    preloadText("Better luck next time! Keep trying!");
  }, []);

  const saveUserProgress = (userProgress: UserProgress) => {
    setProgress(userProgress);
    localStorage.setItem(STORAGE_KEYS.PROGRESS_PREFIX + userProgress.name.toLowerCase(), JSON.stringify(userProgress));
  };

  const handleStart = (name: string) => {
    // Try to load existing progress for this user
    const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + name.toLowerCase());
    
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setProgress(parsed);
      } catch (e) {
        console.error("Error parsing progress", e);
        // Fallback to new user
        const newProgress: UserProgress = { name, progress: {} };
        saveUserProgress(newProgress);
      }
    } else {
      // New user
      const newProgress: UserProgress = { name, progress: {} };
      saveUserProgress(newProgress);
      
      // Update users list if not exists
      const nameExists = existingUsers.some(u => u.toLowerCase() === name.toLowerCase());
      if (!nameExists) {
        const newUsersList = [...existingUsers, name];
        setExistingUsers(newUsersList);
        localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(newUsersList));
      }
    }
    
    setScreen(AppScreen.DASHBOARD);
  };

  const handleLogoChange = (url: string) => {
    setAppLogo(url);
    try {
      localStorage.setItem(STORAGE_KEYS.APP_LOGO, url);
    } catch (e) {
      console.warn("Could not save logo to local storage (likely too large):", e);
    }
  };

  const handleRemoveUser = (nameToRemove: string) => {
    const updatedUsers = existingUsers.filter(u => u !== nameToRemove);
    setExistingUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(updatedUsers));
  };

  const handleSelectItem = (item: TraceItem) => {
    setActiveItem(item);
    setScreen(AppScreen.TRACING);
    speakText(`Let's trace: ${item.speechPrompt}`, 'Kore');

    // Predictive Preload: Load the success message NOW while they are drawing
    // so it's ready instantly when they finish.
    const successMsg = `Amazing job ${progress?.name || ''}! You finished ${item.speechPrompt}!`;
    preloadText(successMsg);
  };

  const handleLogout = () => {
    // Just reset screen state, do not delete data
    setProgress(null);
    setScreen(AppScreen.WELCOME);
    setActiveCategory(Category.ALPHABET); // Reset category on logout
  };

  const handleTraceComplete = async (success: boolean) => {
    if (!progress || !activeItem) return;

    if (success) {
      // Update progress
      const currentCount = progress.progress[activeItem.id] || 0;
      const newCount = currentCount + 1;
      
      const newProgress = {
        ...progress,
        progress: {
          ...progress.progress,
          [activeItem.id]: newCount
        }
      };
      
      saveUserProgress(newProgress);

      // Determine feedback message
      const isLevelUp = newCount >= activeItem.requiredTraces;
      
      let message = "";
      if (isLevelUp) {
        message = `Amazing job ${progress.name}! You finished ${activeItem.speechPrompt}!`;
        await speakText(message);
        
        // Return to dashboard after a short delay to let them hear the praise
        setTimeout(() => {
          setScreen(AppScreen.DASHBOARD);
          setActiveItem(null);
        }, 3000);
      } else {
        message = `Good job! Do it one more time!`;
        await speakText(message);
        // Do NOT navigate back. 
        // The component key update below will clear the canvas for the next attempt.
      }

    } else {
      // Failure / Mistake
      // Record mistake
      const currentMistakes = progress.mistakes?.[activeItem.id] || 0;
      const newProgress = {
        ...progress,
        mistakes: {
          ...progress.mistakes,
          [activeItem.id]: currentMistakes + 1
        }
      };
      saveUserProgress(newProgress);

      await speakText("Better luck next time! Keep trying!");
      // Stay on tracing screen. TracingCanvas handles the visual "X".
    }
  };

  // Generate a key for TracingCanvas that includes the progress count.
  // This forces React to remount the component (and clear the canvas) whenever progress updates successfully.
  const tracingKey = activeItem && progress 
    ? `${activeItem.id}-${progress.progress[activeItem.id] || 0}` 
    : 'tracing-canvas';

  return (
    <div className="antialiased text-gray-800">
      {screen === AppScreen.WELCOME && (
        <Welcome 
          onStart={handleStart} 
          existingUsers={existingUsers}
          logoUrl={appLogo}
          onLogoChange={handleLogoChange}
          onRemoveUser={handleRemoveUser}
          onOpenReports={() => setScreen(AppScreen.REPORTS)}
        />
      )}
      
      {screen === AppScreen.REPORTS && (
        <ProgressReports 
          existingUsers={existingUsers}
          onClose={() => setScreen(AppScreen.WELCOME)}
        />
      )}
      
      {screen === AppScreen.DASHBOARD && progress && (
        <Dashboard 
          progress={progress} 
          onSelectItem={handleSelectItem} 
          onLogout={handleLogout}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}

      {screen === AppScreen.TRACING && activeItem && (
        <TracingCanvas 
          key={tracingKey}
          item={activeItem} 
          onComplete={handleTraceComplete}
          onBack={() => {
             setScreen(AppScreen.DASHBOARD);
             setActiveItem(null);
          }}
        />
      )}
    </div>
  );
};

export default App;