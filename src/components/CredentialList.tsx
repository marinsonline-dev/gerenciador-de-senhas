import React, { useState, useEffect } from 'react';
import { Shield, Search, Edit2 } from 'lucide-react';
import { Credential, User } from '../types';
import { localDb } from '../db/localDb';

interface CredentialListProps {
  credentials: Credential[];
  activeUser: User;
  onEditCredential: (cred: Credential) => void;
}

export default function CredentialList({ credentials, activeUser, onEditCredential }: CredentialListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCreds, setFilteredCreds] = useState<Credential[]>([]);

  // Filter credentials based on search term (only show if search term is active, per original design)
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredCreds([]);
      return;
    }

    const filtered = credentials.filter(c => {
      const siteMatch = c.site && c.site.toLowerCase().includes(term);
      const userMatch = c.username && c.username.toLowerCase().includes(term);
      return siteMatch || userMatch;
    });

    setFilteredCreds(filtered);
  }, [searchTerm, credentials]);

  // Get active masterKey (the ownerId of the user)
  const masterKey = activeUser.ownerId || activeUser.id;

  // Derive first URL to show as subtitle if filtered list has items
  const subtitleUrl = filteredCreds.length > 0
    ? (filteredCreds[0].url || filteredCreds[0].site.toLowerCase().replace(/\s+/g, '') + '.com')
    : '';

  return (
    <div id="viewList" className="w-full max-w-[600px] mx-auto px-4 py-6">
      {/* Top Title Branding */}
      <div className="text-center mb-4 mt-2">
        <h2 className="font-serif tracking-widest text-white text-xl uppercase font-bold select-none">
          <span className="text-[#4BA3FF] opacity-80 mr-2">–</span>
          Gerenciador de Senhas
          <span className="text-[#4BA3FF] opacity-80 ml-2">–</span>
        </h2>
      </div>

      {/* Pulsing Shield Separator */}
      <div className="flex items-center justify-center my-6 gap-3">
        <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-white/20"></div>
        <div className="w-12 h-12 flex items-center justify-center text-[#4BA3FF] relative">
          <div className="absolute inset-0 bg-[#4BA3FF]/20 rounded-full blur-md animate-pulse"></div>
          <Shield className="w-6 h-6 relative z-10 filter drop-shadow-[0_0_8px_rgba(74,163,255,0.8)]" />
        </div>
        <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-white/20"></div>
      </div>

      {/* Busque header label (Playfair Display) */}
      <div className="font-serif italic text-lg text-white mb-3 text-center font-medium select-none">
        Busque
      </div>

      {/* Search Input Box */}
      <div className="relative w-full mb-5">
        <Search className="absolute left-[18px] top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar senhas..."
          className="w-full pl-12 pr-6 py-4 bg-white/[0.03] border border-white/15 rounded-full text-white text-base outline-none focus:border-[#4BA3FF] focus:bg-[#4BA3FF]/5 shadow-[inset_0_4px_15px_rgba(0,0,0,0.2)] placeholder-white/40 transition-all duration-200"
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {/* Dynamic Subtitle Header showing Site info */}
      {searchTerm && filteredCreds.length > 0 && (
        <div className="flex justify-center mb-5 animate-fade-in">
          <a
            href={(() => {
              const url = subtitleUrl;
              if (/^https?:\/\//i.test(url)) {
                return url;
              }
              return `https://${url}`;
            })()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[1.15rem] text-[#00e5ff] hover:text-[#4BA3FF] font-medium tracking-wide drop-shadow-[0_0_8px_rgba(0,229,255,0.6)] hover:underline cursor-pointer transition-colors duration-200"
            title={`Visitar ${subtitleUrl}`}
          >
            <span>Site: {subtitleUrl}</span>
          </a>
        </div>
      )}

      {/* Search Results Table / Grid */}
      {searchTerm && (
        <div className="bg-[#061240]/30 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl animate-fade-in">
          {/* Header row */}
          <div className="flex px-5 py-3.5 border-b border-white/10 text-[0.7rem] text-white/50 font-bold uppercase tracking-wider">
            <div className="flex-[1.4]">Nome</div>
            <div className="flex-[1.6] text-center">Login</div>
            <div className="flex-1 text-right pr-6">Senha</div>
          </div>

          {/* List content */}
          <div className="divide-y divide-white/[0.06]">
            {filteredCreds.length === 0 ? (
              <div className="py-10 text-center text-white/40 text-sm">
                Nenhuma credencial cadastrada para este termo.
              </div>
            ) : (
              filteredCreds.map((cred) => {
                const decryptedPass = localDb.decryptPassword(cred.password, masterKey);

                return (
                  <div
                    key={cred.id}
                    className="flex items-center px-5 py-4 hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    {/* Site name */}
                    <div className="flex-[1.4] flex items-center overflow-hidden pr-2">
                      <span className="font-medium text-[0.95rem] truncate text-white">
                        {cred.site}
                      </span>
                    </div>

                    {/* Username login */}
                    <div className="flex-[1.6] text-center text-sm text-white/80 truncate px-2">
                      {cred.username}
                    </div>

                    {/* Decrypted Password & Edit trigger */}
                    <div className="flex-1 flex justify-end items-center gap-2">
                      <span className="text-[0.95rem] text-white font-mono tracking-wider">
                        {decryptedPass}
                      </span>
                      <button
                        onClick={() => onEditCredential(cred)}
                        className="cursor-pointer p-1.5 text-white/50 hover:text-[#4BA3FF] transition-colors duration-200"
                        title="Editar Credencial"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
