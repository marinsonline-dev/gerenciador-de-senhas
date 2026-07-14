import React, { useState, useEffect } from 'react';
import { Home, Key, UserPlus, Settings } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './db/firebase';
import { firebaseDb, isCreatingSecondaryUser } from './db/firebaseDb';
import { User, Credential } from './types';
import AuthScreen from './components/AuthScreen';
import CredentialList from './components/CredentialList';
import AdminPanel from './components/AdminPanel';
import SettingsPanel from './components/SettingsPanel';
import AccessDenied from './components/AccessDenied';
import EditCredentialModal from './components/EditCredentialModal';

type ActiveView = 'senhas' | 'adicionar' | 'config';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('senhas');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);

  // Load existing session on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isCreatingSecondaryUser) {
        return;
      }
      
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentUser({
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: data.role || 'user',
              created: data.created?.toDate?.()?.toISOString() || data.created || new Date().toISOString(),
              last: data.last?.toDate?.()?.toISOString() || data.last || new Date().toISOString(),
              ownerId: data.ownerId || firebaseUser.uid,
              createdBy: data.createdBy || data.createdBy || firebaseUser.uid,
              adminId: data.adminId || data.adminId || firebaseUser.uid
            });
          } else {
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
              email: firebaseUser.email || '',
              role: 'user',
              created: new Date().toISOString(),
              last: new Date().toISOString(),
              ownerId: firebaseUser.uid,
              createdBy: firebaseUser.uid,
              adminId: firebaseUser.uid
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...newUser,
                created: serverTimestamp(),
                last: serverTimestamp()
              });
            } catch (writeErr) {
              console.error("Error creating missing user profile in Firestore:", writeErr);
            }
            setCurrentUser(newUser);
          }
        } catch (err) {
          console.error("Error loading user profile: ", err);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch credentials via real-time Firestore observer when user changes
  useEffect(() => {
    if (!currentUser) {
      setCredentials([]);
      return;
    }

    const ownerId = currentUser.ownerId || currentUser.id;
    const q = query(collection(db, 'credentials'), where('ownerId', '==', ownerId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const credsList: Credential[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        credsList.push({
          id: docSnap.id,
          site: data.site,
          url: data.url,
          username: data.username,
          password: data.password,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          ownerId: data.ownerId,
          userId: data.userId,
          createdBy: data.createdBy,
        });
      });
      // Sort by newest created
      credsList.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setCredentials(credsList);
    }, (error) => {
      console.error("Error listening to credentials: ", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveView('senhas');
  };

  const handleLogout = async () => {
    try {
      await firebaseDb.logout();
    } catch (err) {
      console.error("Logout error: ", err);
    }
    setCurrentUser(null);
  };

  const handleCredentialAdded = () => {
    // onSnapshot updates this automatically in real-time
  };

  const handleSaveSuccess = () => {
    // onSnapshot updates this automatically in real-time
  };

  const handleDeleteSuccess = () => {
    // onSnapshot updates this automatically in real-time
  };

  // If user is not authenticated, show AuthScreen
  if (!currentUser) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-br from-[#061240] to-[#020B2E] text-white flex items-center justify-center">
        <AuthScreen onLoginSuccess={handleLogin} />
      </main>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-[#061240] to-[#020B2E] text-white relative pb-28">
      {/* Content Area */}
      <div className="w-full max-w-4xl mx-auto py-4">
        {activeView === 'senhas' && (
          <CredentialList
            credentials={credentials}
            activeUser={currentUser}
            onEditCredential={setEditingCredential}
          />
        )}

        {activeView === 'adicionar' && (
          isAdmin ? <AdminPanel activeUser={currentUser} /> : <AccessDenied />
        )}

        {activeView === 'config' && (
          isAdmin ? (
            <SettingsPanel
              activeUser={currentUser}
              onLogout={handleLogout}
              onCredentialAdded={handleCredentialAdded}
            />
          ) : (
            <AccessDenied />
          )
        )}
      </div>

      {/* Persistent Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-[75px] bg-[#020b2e]/95 border-t border-white/[0.05] flex justify-between items-stretch px-4 backdrop-blur-2xl z-1000">
        <button
          onClick={handleLogout}
          className="nav-btn flex-1 flex flex-col items-center justify-center gap-1.5 font-sans text-[0.65rem] font-medium text-white/40 hover:text-white/80 active:scale-95 transition-all duration-200"
          title="Sair da conta"
        >
          <Home className="w-[22px] h-[22px] stroke-[1.5]" />
          Início
        </button>

        <button
          onClick={() => setActiveView('senhas')}
          className={`nav-btn flex-1 flex flex-col items-center justify-center gap-1.5 font-sans text-[0.65rem] font-medium transition-all duration-300 ${
            activeView === 'senhas'
              ? 'text-white bg-[#4ba3ff]/8 border border-[#4ba3ff]/40 rounded-2xl shadow-[inset_0_4px_15px_rgba(74,163,255,0.15)] relative'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Key className="w-[22px] h-[22px] stroke-[1.5]" />
          Senhas
          {activeView === 'senhas' && (
            <span className="absolute bottom-[-1px] left-1/5 right-1/5 h-[3px] bg-[#4BA3FF] shadow-[0_-2px_10px_#4BA3FF] rounded-t-sm"></span>
          )}
        </button>

        <button
          onClick={() => setActiveView('adicionar')}
          className={`nav-btn flex-1 flex flex-col items-center justify-center gap-1.5 font-sans text-[0.65rem] font-medium transition-all duration-300 ${
            activeView === 'adicionar'
              ? 'text-white bg-[#4ba3ff]/8 border border-[#4ba3ff]/40 rounded-2xl shadow-[inset_0_4px_15px_rgba(74,163,255,0.15)] relative'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <UserPlus className="w-[22px] h-[22px] stroke-[1.5]" />
          Adicionar
          {activeView === 'adicionar' && (
            <span className="absolute bottom-[-1px] left-1/5 right-1/5 h-[3px] bg-[#4BA3FF] shadow-[0_-2px_10px_#4BA3FF] rounded-t-sm"></span>
          )}
        </button>

        <button
          onClick={() => setActiveView('config')}
          className={`nav-btn flex-1 flex flex-col items-center justify-center gap-1.5 font-sans text-[0.65rem] font-medium transition-all duration-300 ${
            activeView === 'config'
              ? 'text-white bg-[#4ba3ff]/8 border border-[#4ba3ff]/40 rounded-2xl shadow-[inset_0_4px_15px_rgba(74,163,255,0.15)] relative'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Settings className="w-[22px] h-[22px] stroke-[1.5]" />
          Configurações
          {activeView === 'config' && (
            <span className="absolute bottom-[-1px] left-1/5 right-1/5 h-[3px] bg-[#4BA3FF] shadow-[0_-2px_10px_#4BA3FF] rounded-t-sm"></span>
          )}
        </button>
      </nav>

      {/* Edit modal popup */}
      <EditCredentialModal
        credential={editingCredential}
        activeUser={currentUser}
        onClose={() => setEditingCredential(null)}
        onSaveSuccess={handleSaveSuccess}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </main>
  );
}
