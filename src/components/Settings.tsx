import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { LogOut, Sun, Moon, Bell } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({ notificationsEnabled: true, isDarkMode: true });

  useEffect(() => {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSettings({
          notificationsEnabled: data.notificationsEnabled ?? true,
          isDarkMode: data.isDarkMode ?? true,
        });
      }
    });
    return unsubscribe;
  }, [auth.currentUser]);

  const toggleSetting = async (key: 'notificationsEnabled' | 'isDarkMode') => {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await updateDoc(userDocRef, { [key]: !settings[key] });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 text-white h-full bg-black">
      <h2 className="text-2xl font-bold mb-6">Настройки</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center gap-3">
             <Bell size={20} className="text-gray-400"/>
             <span>Уведомления</span>
          </div>
          <button 
            onClick={() => toggleSetting('notificationsEnabled')}
            className={`w-10 h-6 ${settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-700'} rounded-full cursor-pointer flex items-center p-1 transition-colors ${settings.notificationsEnabled ? 'justify-end' : 'justify-start'}`}
          >
             <div className="w-4 h-4 bg-white rounded-full"/>
          </button>
        </div>
        <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg">
           <div className="flex items-center gap-3">
             <Moon size={20} className="text-gray-400"/>
             <span>Темная тема</span>
           </div>
           <button 
             onClick={() => toggleSetting('isDarkMode')}
             className={`w-10 h-6 ${settings.isDarkMode ? 'bg-blue-600' : 'bg-gray-700'} rounded-full cursor-pointer flex items-center p-1 transition-colors ${settings.isDarkMode ? 'justify-end' : 'justify-start'}`}
           >
             <div className="w-4 h-4 bg-white rounded-full"/>
          </button>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="w-full mt-8 flex items-center justify-center p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
        >
          <LogOut size={20} className="mr-2" />
          Выйти
        </button>
      </div>
    </div>
  );
}
