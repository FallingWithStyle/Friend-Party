'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Magic link sent! Please check your email.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#3d2914] border-2 border-[#8b4513] rounded-xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden">
        {/* Fantasy border glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#d97706] opacity-20 blur-sm"></div>
        
        <div className="relative bg-[#3d2914] p-8 rounded-xl">
          <h2 className="text-2xl font-black mb-6 text-[#fbbf22] text-center font-['IM_Fell_English_SC'] tracking-wide">
            🔮 SUMMON MAGIC PORTAL 🔮
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-lg font-bold text-[#fbbf22] mb-3 font-['IM_Fell_English_SC']">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 border-2 border-[#8b4513] rounded-lg focus:outline-none focus:border-[#fbbf22] focus:ring-4 focus:ring-[#fbbf22]/20 bg-[#2c1810] text-[#f4e4bc] text-lg transition-all duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your magical email..."
              />
            </div>
            
            {message && (
              <div className={`mb-6 p-4 rounded-lg border-2 ${
                message.includes('sent') 
                  ? 'border-[#16a34a] bg-[#065f46] text-[#f4e4bc]' 
                  : 'border-[#dc2626] bg-[#991b1b] text-[#f4e4bc]'
              }`}>
                <p className="text-center font-semibold">
                  {message.includes('sent') ? '✨ Magic link sent! Check your email. ✨' : '❌ ' + message}
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-[#f4e4bc] bg-[#6b3e1a] border-2 border-[#8b4513] rounded-lg hover:bg-[#8b4513] hover:border-[#fbbf22] transition-all duration-300 font-bold font-['IM_Fell_English_SC'] tracking-wide"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#2c1810] rounded-lg font-black font-['IM_Fell_English_SC'] tracking-wide transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  isLoading 
                    ? 'opacity-50 cursor-not-allowed transform-none' 
                    : 'hover:from-[#f59e0b] hover:to-[#d97706]'
                }`}
              >
                {isLoading ? '🔮 Casting...' : '✨ Cast Spell ✨'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}