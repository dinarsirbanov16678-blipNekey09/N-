import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { MessageCircle, MoreVertical, User, Settings, MessageSquare, Search } from 'lucide-react';
import ChatPreview from './ChatPreview';
import Profile from './Profile';
import SettingsComponent from './Settings';

export default function ChatList({ onSelectChat }: { onSelectChat: (chatId: string) => void }) {
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Fetch chats
    const chatsRef = collection(db, 'chats');
    const qChats = query(chatsRef, where('participants', 'array-contains', auth.currentUser.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
      console.log('Chats snapshot:', snapshot.docs.length);
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    // Fetch users
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => {
        unsubscribeChats();
        unsubscribeUsers();
    };
  }, [auth.currentUser]);

  const handleStartChat = async (user: any) => {
    // Check if chat exists
    const existingChat = chats.find(c => c.participants.includes(user.uid) && c.participants.includes(auth.currentUser?.uid));
    if (existingChat) {
      onSelectChat(existingChat.id);
    } else {
      try {
        const chatsRef = collection(db, 'chats');
        const docRef = await addDoc(chatsRef, {
            participants: [auth.currentUser?.uid, user.uid],
            createdAt: Date.now()
        });
        onSelectChat(docRef.id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'chats');
      }
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="p-4 bg-black border-b border-gray-900 flex justify-between items-center">
        <h1 className="text-xl font-bold">N CHAT</h1>
        <button onClick={() => setActiveTab('profile')} className="p-1 rounded-full bg-gray-800">
          <User size={24} />
        </button>
      </div>
      
      {activeTab === 'chats' && (
        <div className="p-4 bg-black">
          <div className="flex items-center bg-black border border-gray-800 rounded-lg px-3 py-2">
            <Search className="text-gray-400 mr-2" size={20} />
            <input
              type="text"
              placeholder="Поиск чатов"
              className="bg-transparent flex-1 focus:outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        {activeTab === 'chats' && filteredChats.map((chat) => {
          const otherParticipantId = chat.participants.find((p: string) => p !== auth.currentUser?.uid);
          const otherUser = users.find(u => u.uid === otherParticipantId);
          return (
            <div 
              key={chat.id} 
              onClick={() => onSelectChat(chat.id)}
              className="flex items-center p-4 border-b border-gray-900 cursor-pointer hover:bg-gray-900"
            >
              {otherUser?.photoURL ? (
                <img src={otherUser.photoURL} alt={otherUser.displayName} className="w-10 h-10 rounded-full mr-3" />
              ) : (
                <User size={40} className="mr-3 p-2 bg-gray-900 rounded-full" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{otherUser ? otherUser.displayName : chat.id}</p>
                <ChatPreview chatId={chat.id} />
              </div>
            </div>
          );
        })}
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'settings' && <SettingsComponent />}
      </div>

      <div className="flex justify-around items-center bg-gray-950 p-3 border-t border-gray-800">
        <button onClick={() => setActiveTab('chats')} className={`flex flex-col items-center ${activeTab === 'chats' ? 'text-blue-500' : 'text-gray-500'}`}>
          <MessageCircle size={24} />
          <span className="text-[10px] mt-1">Чаты</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500'}`}>
          <Settings size={24} />
          <span className="text-[10px] mt-1">Настройки</span>
        </button>
      </div>
    </div>
  );
}
