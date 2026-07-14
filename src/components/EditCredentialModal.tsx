import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { Credential, User } from '../types';
import { firebaseDb } from '../db/firebaseDb';

interface EditCredentialModalProps {
  credential: Credential | null;
  activeUser: User;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeleteSuccess: () => void;
}

export default function EditCredentialModal({
  credential,
  activeUser,
  onClose,
  onSaveSuccess,
  onDeleteSuccess,
}: EditCredentialModalProps) {
  const [site, setSite] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = activeUser.role === 'admin';
  const masterKey = activeUser.ownerId || activeUser.id;

  // Initialize form when credential changes
  useEffect(() => {
    if (credential) {
      setSite(credential.site);
      setUrl(credential.url || '');
      setUsername(credential.username);
      
      try {
        const bytes = CryptoJS.AES.decrypt(credential.password, masterKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        setPassword(decrypted);
      } catch (err) {
        setPassword('');
      }
      setErrorMsg('');
      setShowConfirmDelete(false);
    }
  }, [credential, masterKey]);

  if (!credential) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setErrorMsg('');
    setIsSaving(true);

    if (!site.trim() || !url.trim() || !username.trim() || !password.trim()) {
      setErrorMsg('Todos os campos são obrigatórios.');
      setIsSaving(false);
      return;
    }

    try {
      await firebaseDb.updateCredential(
        credential.id,
        site,
        url,
        username,
        password,
        masterKey
      );

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg('Erro: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrigger = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin) return;
    setIsSaving(true);

    try {
      await firebaseDb.deleteCredential(credential.id);
      onDeleteSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg('Erro: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="editCredentialModal"
      className="fixed inset-0 bg-[#020b2e]/95 backdrop-blur-md flex items-center justify-center z-[2000] p-4 transition-all duration-300"
    >
      <div className="bg-[#061240] border border-white/15 rounded-3xl p-6 w-full max-w-[480px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0 text-base font-serif tracking-widest text-[#4BA3FF] uppercase font-bold">
            Detalhes da Credencial
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer bg-transparent border-none text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Non-Admin alert badge */}
        {!isAdmin && (
          <div
            id="nonAdminBadge"
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5 text-xs text-amber-500 leading-relaxed font-medium"
          >
            Apenas administradores podem alterar estes dados.
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">Nome do Serviço / Empresa</label>
            <input
              type="text"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              required
              disabled={!isAdmin}
              className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/30 transition-all duration-200 ${
                isAdmin ? 'focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5' : 'opacity-70 cursor-not-allowed'
              }`}
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">URL / Site</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={!isAdmin}
              className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/30 transition-all duration-200 ${
                isAdmin ? 'focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5' : 'opacity-70 cursor-not-allowed'
              }`}
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">Usuário / E-mail do Serviço</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={!isAdmin}
              className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none placeholder-white/30 transition-all duration-200 ${
                isAdmin ? 'focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5' : 'opacity-70 cursor-not-allowed'
              }`}
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5 font-medium">Senha</label>
            <input
              type={isAdmin ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!isAdmin}
              className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm outline-none font-mono transition-all duration-200 ${
                isAdmin ? 'focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5' : 'opacity-70 cursor-not-allowed'
              }`}
              spellCheck="false"
            />
          </div>

          {/* Modal Actions */}
          {isAdmin && (
            <div className="pt-3">
              {showConfirmDelete ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center animate-fade-in space-y-3">
                  <p className="text-sm text-red-200">Tem certeza que deseja excluir esta credencial?</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setShowConfirmDelete(false)}
                      className="cursor-pointer flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleConfirmDelete}
                      className="cursor-pointer flex-1 py-2.5 bg-[#FF4757] hover:bg-[#ff6b81] active:bg-[#ff2e44] text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      {isSaving ? 'Deletando...' : 'Sim, Deletar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div id="modalActions" className="flex gap-3">
                  <button
                    type="button"
                    id="btnDeleteCred"
                    disabled={isSaving}
                    onClick={handleDeleteTrigger}
                    className="cursor-pointer flex-1 py-3 font-semibold bg-[#FF4757] hover:bg-[#ff6b81] active:bg-[#ff2e44] active:scale-[0.98] text-white text-sm rounded-xl border-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deletar Credencial
                  </button>

                  <button
                    type="submit"
                    id="btnSaveCred"
                    disabled={isSaving}
                    className="cursor-pointer flex-1 py-3 font-semibold bg-[#2272F5] hover:bg-[#3D8EFF] active:scale-[0.98] text-white text-sm rounded-xl border-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
