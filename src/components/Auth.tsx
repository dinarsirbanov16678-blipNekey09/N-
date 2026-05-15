import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { MessageCircle } from 'lucide-react';

export default function Auth() {
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in", error);
      alert("Ошибка при входе. Попробуйте еще раз.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white p-4">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-gray-800">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Добро пожаловать</h1>
        <p className="text-gray-400 mb-8">Войдите в систему, чтобы продолжить</p>
        <button 
          onClick={handleSignIn}
          className="w-full px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
        >
          Войти через Google
        </button>
      </div>
    </div>
  );
}
