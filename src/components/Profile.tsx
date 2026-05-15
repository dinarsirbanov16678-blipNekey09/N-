import { useState } from 'react';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, LogOut, Edit2, Save } from 'lucide-react';

export default function Profile() {
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(auth.currentUser?.photoURL || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateProfile = async () => {
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName, photoURL });
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, { displayName, photoURL });
        setIsEditing(false);
        alert("Профиль успешно обновлен");
      } catch (error) {
        console.error("Error updating profile", error);
        alert("Ошибка при обновлении профиля");
      }
    }
  };

  return (
    <div className="p-6 text-white h-screen bg-black flex flex-col items-center">
      <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6 overflow-hidden">
         {photoURL ? <img src={photoURL} alt="Profile" className="w-24 h-24 object-cover" /> : <User size={48} className="text-gray-500"/>}
      </div>
      <div className="w-full max-w-sm mb-6">
        <label className="text-gray-400 text-sm">Имя профиля</label>
        <div className="flex items-center">
          <input 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={!isEditing}
            className="flex-1 bg-gray-900 p-2 rounded-lg mt-1 focus:outline-none"
          />
          <button onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)} className="ml-3 p-2 hover:bg-gray-800 rounded-full">
            {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
          </button>
        </div>
      </div>
       <div className="w-full max-w-sm mb-6">
        <label className="text-gray-400 text-sm">URL аватара</label>
        <div className="flex items-center">
          <input 
            value={photoURL} 
            onChange={(e) => setPhotoURL(e.target.value)}
            disabled={!isEditing}
            className="flex-1 bg-gray-900 p-2 rounded-lg mt-1 focus:outline-none"
          />
        </div>
      </div>
      <div className="w-full max-w-sm mb-8">
        <label className="text-gray-400 text-sm">Эл. почта</label>
        <p className="bg-gray-900 p-2 rounded-lg mt-1 text-gray-500">{auth.currentUser?.email}</p>
      </div>
    </div>
  );
}
