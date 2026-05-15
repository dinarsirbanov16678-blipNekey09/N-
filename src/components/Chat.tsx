import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Check, Send, Mic, Square } from 'lucide-react';
import { motion } from 'motion/react';

export default function Chat({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false); // Add isSending state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const initChat = async () => {
      try {
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        if (!chatDoc.exists()) {
          await setDoc(chatRef, {
            participants: [auth.currentUser?.uid],
            createdAt: Date.now()
          });
        } else {
          await updateDoc(chatRef, {
            participants: arrayUnion(auth.currentUser?.uid)
          });
        }
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'chats/' + chatId);
        return false;
      }
    };

    const setupListener = async () => {
      const initialized = await initChat();
      if (!initialized) return;

      const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgList);
        
        const unreadMessages = msgList.filter(m => m.senderId !== auth.currentUser?.uid && !m.read);
        if (unreadMessages.length > 0) {
          import('firebase/firestore').then(({ writeBatch, doc }) => {
            const batch = writeBatch(db);
            unreadMessages.forEach(m => {
              batch.update(doc(db, 'chats', chatId, 'messages', m.id), { read: true });
            });
            batch.commit().catch(e => console.error("Batch update failed", e));
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'chats/' + chatId + '/messages');
      });

      return unsubscribe;
    };

    let unsubscribe: any;
    setupListener().then(unsub => { unsubscribe = unsub; });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [chatId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: auth.currentUser?.uid,
        createdAt: Date.now(),
        read: false
      });
      setText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats/' + chatId + '/messages');
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = async () => {
        setIsSending(true); // Start sending
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        setIsSending(false); // Stop sending
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording failed", error);
      setErrorMessage("Ошибка доступа к микрофону. Пожалуйста, разрешите доступ.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "audio.webm");
        formData.append("chatId", chatId);

        const response = await fetch("/api/upload-voice", {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Upload failed");
        
        const { url } = await response.json();
        
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            audioUrl: url,
            senderId: auth.currentUser?.uid,
            createdAt: Date.now(),
            read: false,
            type: 'voice'
          });
      } catch (error) {
          console.error("Voice upload failed", error);
      }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#0f0f0f] text-white">
      <div className="flex-1 pt-0 p-4 overflow-auto space-y-2">
        {messages.map((m: any) => (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            key={m.id}
            className={`relative px-4 py-2 max-w-[85%] rounded-2xl flex flex-col shadow-sm 
            ${m.senderId === auth.currentUser?.uid 
                ? 'bg-[#2b5278] text-white ml-auto rounded-br-none' 
                : 'bg-[#182533] text-gray-100 rounded-bl-none border border-[#0d1621]'
            }`}
          >
            {m.senderId !== auth.currentUser?.uid && !m.read && (
                <div className="absolute -left-2 top-3 w-2 h-2 bg-blue-500 rounded-full" />
            )}
            {m.type === 'voice' ? (
                <audio controls src={m.audioUrl} className="h-8 w-48" />
            ) : (
                <p className="text-sm">{m.text}</p>
            )}
            <div className={`text-[10px] mt-0.5 flex items-center justify-end gap-1
              ${m.senderId === auth.currentUser?.uid ? 'text-blue-200' : 'text-gray-400'}`}>
                <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {m.senderId === auth.currentUser?.uid && (
                    <span className="flex">
                        <Check size={12} className={m.read ? 'text-blue-200' : 'text-gray-400'} />
                        {m.read && <Check size={12} className="text-blue-200 -ml-1" />}
                    </span>
                )}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="p-3 bg-[#182533] border-t border-[#0d1621]">
        {errorMessage && (
            <div className="text-red-500 text-xs text-center mb-2">{errorMessage}</div>
        )}
        <div className="flex gap-2">
          {!isRecording ? (
            <button onClick={startRecording} className="p-3 bg-gray-700 rounded-full">
                <Mic size={18} className="text-white" />
            </button>
          ) : isSending ? (
             <div className="p-3 bg-gray-700 rounded-full">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
             </div>
          ) : (
             <button onClick={stopRecording} className="p-3 bg-red-600 rounded-full animate-pulse">
                <Square size={18} className="text-white" />
            </button>
          )}

          <input 
            value={text} 
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#0f0f0f] rounded-2xl focus:outline-none text-sm"
            placeholder="Сообщение..."
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage} 
            className="p-3 bg-[#2b5278] rounded-full flex items-center justify-center transition-colors"
          >
            <Send size={18} className="text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
