import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  getAuth,
  setPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { initializeApp, deleteApp, getApp } from 'firebase/app';
import CryptoJS from 'crypto-js';
import { auth, db } from './firebase';
import { User, Credential, UserRole } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export function translateFirebaseError(err: any): string {
  if (!err) return 'Ocorreu um erro desconhecido.';
  
  const code = err.code || (err.message && err.message.includes('auth/') ? err.message : '');
  
  if (code.includes('auth/email-already-in-use')) {
    return 'Este nome de usuário já está sendo utilizado.';
  }
  if (code.includes('auth/weak-password')) {
    return 'A senha deve conter pelo menos 6 caracteres.';
  }
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
    return 'Usuário ou senha incorretos.';
  }
  if (code.includes('auth/invalid-email')) {
    return 'Nome de usuário inválido.';
  }
  if (code.includes('auth/user-disabled')) {
    return 'Esta conta de usuário foi desativada.';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Falha de conexão com o servidor. Verifique sua conexão com a internet.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Muitas tentativas incorretas. Sua conta foi temporariamente bloqueada. Tente novamente mais tarde.';
  }
  
  return err.message || 'Erro ao processar a requisição.';
}

export let isCreatingSecondaryUser = false;

export const firebaseDb = {
  // Register user
  async registerUser(username: string, pass: string, name: string): Promise<User> {
    const email = `${username.trim().toLowerCase()}@localapp.com`;
    
    try {
      // Create authentication account
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = userCred.user.uid;

      const newUser: User = {
        id: uid,
        name: name.trim() || username.trim(),
        email,
        role: 'admin',
        created: new Date().toISOString(),
        last: new Date().toISOString(),
        ownerId: uid,
        createdBy: uid,
        adminId: uid
      };

      // Save profile to Firestore
      try {
        await setDoc(doc(db, 'users', uid), {
          ...newUser,
          created: serverTimestamp(),
          last: serverTimestamp()
        });
      } catch (firestoreErr) {
        console.warn("Firestore register user document save failed but Auth succeeded:", firestoreErr);
      }

      return newUser;
    } catch (err: any) {
      console.error('Registration error: ', err);
      throw new Error(translateFirebaseError(err));
    }
  },

  // Login user
  async loginUser(username: string, pass: string): Promise<User> {
    const email = `${username.trim().toLowerCase()}@localapp.com`;
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const uid = userCred.user.uid;

      const userDocSnap = await getDoc(doc(db, 'users', uid));
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        
        // Update last login timestamp
        try {
          await updateDoc(doc(db, 'users', uid), {
            last: serverTimestamp()
          });
        } catch (updateErr) {
          console.warn("Update last login failed:", updateErr);
        }

        return {
          id: uid,
          name: data.name || username,
          email,
          role: data.role || 'user',
          created: data.created?.toDate?.()?.toISOString() || new Date().toISOString(),
          last: new Date().toISOString(),
          ownerId: data.ownerId || uid,
          createdBy: data.createdBy || uid,
          adminId: data.adminId || uid
        };
      } else {
        // Create profile fallback
        const newUser: User = {
          id: uid,
          name: username,
          email,
          role: 'user',
          created: new Date().toISOString(),
          last: new Date().toISOString(),
          ownerId: uid,
          createdBy: uid,
          adminId: uid
        };
        try {
          await setDoc(doc(db, 'users', uid), {
            ...newUser,
            created: serverTimestamp(),
            last: serverTimestamp()
          });
        } catch (err) {
          console.warn("Login fallback setDoc failed:", err);
        }
        return newUser;
      }
    } catch (err: any) {
      console.error('Login error: ', err);
      throw new Error(translateFirebaseError(err));
    }
  },

  // Admin creating another user
  async adminCreateUser(username: string, pass: string, role: UserRole, creatorUser: User): Promise<void> {
    const email = `${username.trim().toLowerCase()}@localapp.com`;

    const adminUid = creatorUser.id;
    const createdByValue = creatorUser.id;
    const adminIdValue = creatorUser.adminId || creatorUser.ownerId || creatorUser.id;

    isCreatingSecondaryUser = true;

    const secondaryAppName = 'SecondaryApp_' + Math.random().toString(36).substring(2, 9);
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    // CRITICAL: force this secondary auth session to stay in-memory only,
    // so it never touches shared browser storage or leaks into the main
    // admin session's onAuthStateChanged listener.
    await setPersistence(secondaryAuth, inMemoryPersistence);

    try {
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
      const secondaryUid = userCred.user.uid;

      console.log('DEBUG adminCreateUser -> adminUid captured:', adminUid);
      console.log('DEBUG adminCreateUser -> new secondaryUid:', secondaryUid);

      try {
        await setDoc(doc(db, 'users', secondaryUid), {
          id: secondaryUid,
          name: username.trim(),
          email,
          role,
          created: serverTimestamp(),
          last: serverTimestamp(),
          ownerId: adminUid,
          createdBy: createdByValue,
          adminId: adminIdValue
        });
      } catch (firestoreErr) {
        console.warn("Firestore secondary user document save failed but Auth succeeded:", firestoreErr);
      }
    } catch (err: any) {
      console.error('Admin create user error: ', err);
      throw new Error(translateFirebaseError(err));
    } finally {
      await deleteApp(secondaryApp);
      isCreatingSecondaryUser = false;
    }
  },


  // Log out
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Credentials actions
  async addCredential(site: string, url: string, username: string, plainPass: string, activeUser: User): Promise<void> {
    const ownerId = activeUser.ownerId || activeUser.id;
    const encryptedPass = CryptoJS.AES.encrypt(plainPass, ownerId).toString();

    await addDoc(collection(db, 'credentials'), {
      site: site.trim(),
      url: url.trim(),
      username: username.trim(),
      password: encryptedPass,
      createdAt: serverTimestamp(),
      ownerId,
      userId: activeUser.id,
      createdBy: activeUser.id
    });
  },

  async updateCredential(credId: string, site: string, url: string, username: string, plainPass: string, ownerId: string): Promise<void> {
    const encryptedPass = CryptoJS.AES.encrypt(plainPass, ownerId).toString();

    await updateDoc(doc(db, 'credentials', credId), {
      site: site.trim(),
      url: url.trim(),
      username: username.trim(),
      password: encryptedPass
    });
  },

  async deleteCredential(credId: string): Promise<void> {
    await deleteDoc(doc(db, 'credentials', credId));
  }
};
