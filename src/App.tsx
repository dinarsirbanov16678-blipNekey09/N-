/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import Auth from './components/Auth';
import Chat from './components/Chat';
import ChatList from './components/ChatList';

const SplashScreen = () => (
  <motion.div
    className="h-screen flex items-center justify-center bg-black"
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.h1
      className="text-6xl font-bold text-white tracking-tighter"
      initial={{ textShadow: "0 0 0px #3b82f6" }}
      animate={{ textShadow: "0 0 20px #3b82f6, 0 0 40px #3b82f6" }}
      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
    >
      N CHAT
    </motion.h1>
  </motion.div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName || 'Anonymous',
                email: user.email,
                createdAt: Date.now(),
                isDarkMode: true
            });
        } else {
            setIsDarkMode(userDoc.data().isDarkMode ?? true);
            const unsubscribe = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setIsDarkMode(doc.data().isDarkMode ?? true);
                }
            });
            return unsubscribe;
        }
      }
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  if (!user) return <Auth />;
  
  let content;
  if (activeChat) {
    content = (
        <div className="h-screen flex flex-col bg-black">
            <button onClick={() => setActiveChat(null)} className="p-2 text-white"><ArrowLeft /></button>
            <Chat chatId={activeChat} />
        </div>
    );
  } else {
    content = <ChatList onSelectChat={setActiveChat} />;
  }

  return (
    <AnimatePresence>
      {showSplash ? (
        <SplashScreen key="splash" />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full"
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
