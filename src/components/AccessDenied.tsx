import React from 'react';
import { Lock } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div id="viewAccessDenied" className="w-full max-w-[600px] mx-auto px-4 py-10 animate-fade-in">
      <div className="bg-red-500/[0.05] border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <Lock className="w-8 h-8 stroke-[1.5]" />
        </div>
        
        <h3 className="text-[#FF4757] text-2xl font-bold mb-3">Acesso Negado</h3>
        
        <p className="text-white/80 text-base leading-relaxed mb-4">
          Privilégios de administrador requeridos.
        </p>
        
        <p className="text-white/50 text-sm leading-relaxed">
          Somente usuários com a função de <strong>Administrador</strong> podem acessar a página de gerenciamento e adicionar novos usuários.
        </p>
      </div>
    </div>
  );
}
