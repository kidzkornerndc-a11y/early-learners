import React, { useState, useRef, useEffect } from 'react';
import { speakText } from '../services/geminiService';

interface WelcomeProps {
  onStart: (name: string) => void;
  existingUsers: string[];
  logoUrl: string;
  onLogoChange: (url: string) => void;
  onRemoveUser: (name: string) => void;
  onOpenReports: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ 
  onStart, 
  existingUsers, 
  logoUrl, 
  onLogoChange, 
  onRemoveUser,
  onOpenReports
}) => {
  const [name, setName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStart = () => {
    if (name.trim()) {
      speakText(`Welcome, ${name}! Let's learn!`, 'Puck');
      onStart(name.trim());
    }
  };

  const handleUserSelect = (selectedName: string) => {
    setName(selectedName);
    setShowDropdown(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Create an image element to load the data
        const img = new Image();
        img.onload = () => {
          // Resize the image to avoid hitting LocalStorage quotas
          // 300px is plenty for a logo displayed at w-32 (128px)
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300; 
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Fill background with white to handle transparent PNGs
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);
            // Compress as JPEG with 0.7 quality to significantly reduce string size
            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            onLogoChange(resizedDataUrl);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = existingUsers.filter(user => 
    user.toLowerCase().includes(name.toLowerCase())
  );

  // SVG Pattern for Pastel Lego Blocks (Pink, Blue, Green)
  const legoPattern = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3C!-- Pink Block --%3E%3Crect x='0' y='0' width='50' height='50' fill='%23F472B6'/%3E%3Ccircle cx='25' cy='25' r='15' fill='%23FBCFE8' opacity='0.8'/%3E%3Ccircle cx='25' cy='25' r='15' stroke='rgba(0,0,0,0.1)' stroke-width='1'/%3E%3C!-- Blue Block --%3E%3Crect x='50' y='0' width='50' height='50' fill='%2360A5FA'/%3E%3Ccircle cx='75' cy='25' r='15' fill='%23BFDBFE' opacity='0.8'/%3E%3Ccircle cx='75' cy='25' r='15' stroke='rgba(0,0,0,0.1)' stroke-width='1'/%3E%3C!-- Green Block --%3E%3Crect x='0' y='50' width='50' height='50' fill='%234ADE80'/%3E%3Ccircle cx='25' cy='75' r='15' fill='%23BBF7D0' opacity='0.8'/%3E%3Ccircle cx='25' cy='75' r='15' stroke='rgba(0,0,0,0.1)' stroke-width='1'/%3E%3C!-- Pink Block Repeated --%3E%3Crect x='50' y='50' width='50' height='50' fill='%23F472B6'/%3E%3Ccircle cx='75' cy='75' r='15' fill='%23FBCFE8' opacity='0.8'/%3E%3Ccircle cx='75' cy='75' r='15' stroke='rgba(0,0,0,0.1)' stroke-width='1'/%3E%3C/svg%3E`;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ backgroundImage: `url("${legoPattern}")` }}
    >
      {/* Top Bar for Reports */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onOpenReports}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border-2 border-purple-200 text-purple-600 font-bold hover:bg-purple-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          <span className="hidden sm:inline">Progress Reports</span>
        </button>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-purple-500 relative">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-500 mb-6 font-hand drop-shadow-sm">
          Early Learners
        </h1>
        
        <div className="mb-8 relative group inline-block">
          <img 
            src={logoUrl} 
            alt="Learning Mascot" 
            className="w-32 h-32 mx-auto rounded-full border-4 border-pink-400 object-cover bg-white"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-md"
            title="Edit Picture"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        <p className="text-gray-600 text-lg mb-4 font-bold">What's your name?</p>
        
        <div className="relative mb-6" ref={dropdownRef}>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type name here..."
            className="w-full text-center text-2xl p-4 rounded-xl border-2 border-black bg-white focus:outline-none focus:ring-4 focus:ring-blue-300 font-bold text-gray-800 placeholder-gray-400 shadow-inner"
          />
          
          {showDropdown && filteredUsers.length > 0 && (
            <div className="absolute w-full mt-1 bg-white border-2 border-black rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
              {filteredUsers.map((user) => (
                <div
                  key={user}
                  className="flex items-center justify-between border-b border-gray-100 last:border-0 hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg transition-colors group"
                >
                  <button
                    onClick={() => handleUserSelect(user)}
                    className="flex-grow text-left px-4 py-3 text-xl font-medium text-gray-700 focus:outline-none"
                  >
                    {user}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveUser(user);
                    }}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-full m-1"
                    title="Remove Name"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={!name.trim()}
          className={`w-full py-4 rounded-2xl text-2xl font-bold text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl ${
            name.trim() 
              ? 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 shadow-green-200' 
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Let's Play! 🚀
        </button>
      </div>
    </div>
  );
};