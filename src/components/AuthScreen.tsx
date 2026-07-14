import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { User } from '../types';
import { firebaseDb } from '../db/firebaseDb';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!username.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      setIsLoading(false);
      return;
    }

    try {
      if (authMode === 'register') {
        const user = await firebaseDb.registerUser(username, password, name);
        onLoginSuccess(user);
      } else {
        const user = await firebaseDb.loginUser(username, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error('Auth error: ', err);
      setErrorMessage(err.message || 'Erro na autenticação. Verifique os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="authScreen" className="flex items-center justify-center relative px-4 w-full min-h-screen">
      <div className="bg-[#061240]/40 border border-white/10 backdrop-blur-xl rounded-3xl p-10 w-full max-w-[440px] text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="mb-6 mt-4">
          <h2 className="font-serif tracking-wider text-white text-base sm:text-lg uppercase font-bold select-none whitespace-nowrap flex items-center justify-center gap-1.5">
            <span className="text-[#4BA3FF] opacity-80">–</span> 
            Gerenciador de Senhas 
            <span className="text-[#4BA3FF] opacity-80">–</span>
          </h2>
        </div>

        {/* Shield graphic in center */}
        <div className="flex items-center justify-center my-6 gap-3">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-white/20"></div>
          <div className="w-12 h-12 flex items-center justify-center text-[#4BA3FF] relative group">
            <div className="absolute inset-0 bg-[#4BA3FF]/20 rounded-full blur-md animate-pulse"></div>
            <Shield className="w-7 h-7 relative z-10 filter drop-shadow-[0_0_8px_rgba(74,163,255,0.8)]" />
          </div>
          <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-white/20"></div>
        </div>

        <p className="text-sm text-white/70 mb-6 leading-relaxed">
          Para garantir a segurança e o isolamento das suas credenciais, faça login com a sua conta local.
        </p>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
            className={`flex-1 pb-3 text-sm font-semibold transition-all duration-300 border-b-2 ${
              authMode === 'login'
                ? 'text-[#4BA3FF] border-[#4BA3FF]'
                : 'text-white/50 border-transparent hover:text-white/80'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
            className={`flex-1 pb-3 text-sm font-semibold transition-all duration-300 border-b-2 ${
              authMode === 'register'
                ? 'text-[#4BA3FF] border-[#4BA3FF]'
                : 'text-white/50 border-transparent hover:text-white/80'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-lg text-left">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {authMode === 'register' && (
            <div className="text-left">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu Nome (Apenas cadastro)"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/40 focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 transition-all duration-200"
                spellCheck="false"
              />
            </div>
          )}

          <div className="text-left">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuário"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/40 focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 transition-all duration-200"
              spellCheck="false"
            />
          </div>

          <div className="text-left">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/40 focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-[#2272F5] hover:bg-[#3D8EFF] active:scale-[0.98] active:bg-[#2ED573] text-white font-semibold rounded-xl text-base cursor-pointer shadow-lg shadow-blue-500/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Aguarde...' : (authMode === 'login' ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>
      </div>


    </div>
  );
}
