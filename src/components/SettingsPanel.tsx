import React, { useState } from 'react';
import { User } from '../types';
import { firebaseDb } from '../db/firebaseDb';

interface SettingsPanelProps {
  activeUser: User;
  onLogout: () => void;
  onCredentialAdded: () => void;
}

export default function SettingsPanel({ activeUser, onLogout, onCredentialAdded }: SettingsPanelProps) {
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [siteUser, setSiteUser] = useState('');
  const [sitePass, setSitePass] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setIsLoading(true);

    if (!siteName.trim() || !siteUrl.trim() || !siteUser.trim() || !sitePass.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      setIsLoading(false);
      return;
    }

    try {
      await firebaseDb.addCredential(siteName, siteUrl, siteUser, sitePass, activeUser);
      setSuccessMsg('Credencial criptografada e salva com sucesso!');
      
      // Clear fields
      setSiteName('');
      setSiteUrl('');
      setSiteUser('');
      setSitePass('');

      // Notify parent to refresh credential list in real-time
      onCredentialAdded();
    } catch (err: any) {
      setErrorMsg('Erro ao salvar dados: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="viewConfig" className="w-full max-w-[600px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Card 1: Add New Credential Form */}
      <div className="bg-white/[0.06] border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold text-[#4BA3FF] mb-5">Nova Credencial</h3>
        
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
            <label className="block text-xs text-white/60 mb-1.5 font-medium">Nome do Serviço / Empresa</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Ex: Amazon, AMIL, Banco do Brasil"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/30 focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 transition-all duration-200"
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">URL / Site</label>
            <input
              type="text"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="Ex: www.amazon.com"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/30 focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 transition-all duration-200"
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">Usuário / E-mail do Serviço</label>
            <input
              type="text"
              value={siteUser}
              onChange={(e) => setSiteUser(e.target.value)}
              placeholder="Ex: login@provedor.com"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/30 focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 transition-all duration-200"
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">Senha</label>
            <input
              type="password"
              value={sitePass}
              onChange={(e) => setSitePass(e.target.value)}
              placeholder="Digite a senha para guardar"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/30 focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-[#2272F5] hover:bg-[#3D8EFF] active:bg-[#2ED573] text-white font-semibold rounded-xl text-base cursor-pointer shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Criptografando...' : 'Criptografar e Salvar'}
          </button>
        </form>
      </div>

      {/* Card 2: Active Session Control */}
      <div className="bg-white/[0.06] border border-white/5 rounded-3xl p-6 text-center backdrop-blur-md">
        <h3 className="text-lg font-bold text-[#4BA3FF] mb-3">Sessão Ativa</h3>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          Gerencie sua sessão atual de usuário.
        </p>
        <button
          onClick={onLogout}
          className="cursor-pointer w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-semibold rounded-xl text-base transition-all duration-200"
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
