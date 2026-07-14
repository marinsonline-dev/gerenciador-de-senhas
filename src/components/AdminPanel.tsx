import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { firebaseDb } from '../db/firebaseDb';

interface AdminPanelProps {
  activeUser: User;
}

export default function AdminPanel({ activeUser }: AdminPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setIsLoading(true);

    if (!username.trim() || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    try {
      await firebaseDb.adminCreateUser(username, password, role, activeUser);
      setSuccessMsg(`Usuário '${username}' cadastrado com sucesso como ${role === 'admin' ? 'Administrador' : 'Comum'}!`);
      setUsername('');
      setPassword('');
      setRole('user');
    } catch (err: any) {
      console.error('Error creating user: ', err);
      setErrorMsg(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="viewAdminUsers" className="w-full max-w-[600px] mx-auto px-4 py-6 animate-fade-in">
      <div className="bg-white/[0.06] border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold text-[#4BA3FF] mb-6">Adicionar Novo Usuário</h3>

        {successMsg && (
          <div className="mb-4 text-xs text-green-400 bg-green-500/10 border border-green-500/20 py-2.5 px-3 rounded-lg">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite o usuário"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/30 focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 transition-all duration-200"
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/30 focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">Permissão do Usuário</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none cursor-pointer focus:border-[#4BA3FF] transition-all duration-200"
            >
              <option value="user" className="text-black">Usuário</option>
              <option value="admin" className="text-black">Administrador</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#2272F5] hover:bg-[#3D8EFF] text-white font-semibold rounded-xl text-sm cursor-pointer shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar Usuário'}
          </button>
        </form>
      </div>
    </div>
  );
}
