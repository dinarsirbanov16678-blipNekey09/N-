import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export default function ChatPreview({ chatId }: { chatId: string }) {
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLastMessage(snapshot.docs[0].data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats/' + chatId + '/messages');
    });

    return () => unsubscribe();
  }, [chatId]);

  if (!lastMessage) return <p className="text-gray-500 text-sm">Нет сообщений</p>;

  const date = new Date(lastMessage.createdAt);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isUnread = lastMessage.senderId !== auth.currentUser?.uid;

  return (
    <div className="flex justify-between items-center">
      <p className={`text-sm truncate max-w-[150px] ${isUnread ? 'text-white' : 'text-gray-400'}`}>{lastMessage.text}</p>
      <div className="flex items-center ml-2">
        <p className="text-gray-600 text-xs">{timeString}</p>
        {isUnread && <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>}
      </div>
    </div>
  );
}
