import CryptoJS from 'crypto-js';
import { User, Credential, UserRole } from '../types';

const USERS_KEY = 'gs_users_db';
const CREDENTIALS_KEY = 'gs_credentials_db';
const SESSION_KEY = 'gs_current_session';

// Initialize mock DB if empty
const initializeDb = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultUsers: User[] = [];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(CREDENTIALS_KEY) || JSON.parse(localStorage.getItem(CREDENTIALS_KEY) || '[]').length === 0) {
    const seedCreds: any[] = [];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(seedCreds));
  }
};

initializeDb();

export const localDb = {
  // --- USER AUTHENTICATION & REGISTRATION ---
  getUsers(): User[] {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUsers(users: User[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getCurrentSession(): User | null {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  setCurrentSession(user: User | null) {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  // Create a new user with email and password
  registerUser(username: string, pass: string, name: string, role: UserRole = 'admin'): { user: User; error?: string } {
    const users = this.getUsers();
    const email = `${username.trim().toLowerCase()}@localapp.com`;

    if (users.find(u => u.email === email)) {
      return { user: null as any, error: 'Este usuário já está cadastrado.' };
    }

    const newId = 'usr_' + Math.random().toString(36).substring(2, 11);
    // Secure password storage in mock: we will just store user credentials in a safe way
    // (We can associate passwords with emails in a separate storage or within the user object)
    const userPasswords = JSON.parse(localStorage.getItem('gs_user_passwords') || '{}');
    userPasswords[email] = pass;
    localStorage.setItem('gs_user_passwords', JSON.stringify(userPasswords));

    const newUser: User = {
      id: newId,
      name: name.trim() || username.trim(),
      email,
      role,
      created: new Date().toISOString(),
      last: new Date().toISOString(),
      ownerId: newId, // Default owner is themselves
    };

    users.push(newUser);
    this.saveUsers(users);

    return { user: newUser };
  },

  // Log in user
  loginUser(username: string, pass: string): { user: User | null; error?: string } {
    const users = this.getUsers();
    const email = `${username.trim().toLowerCase()}@localapp.com`;
    const user = users.find(u => u.email === email);

    if (!user) {
      return { user: null, error: 'Usuário não encontrado.' };
    }

    const userPasswords = JSON.parse(localStorage.getItem('gs_user_passwords') || '{}');
    const storedPass = userPasswords[email];

    if (storedPass !== pass) {
      return { user: null, error: 'Senha incorreta.' };
    }

    // Update last login
    user.last = new Date().toISOString();
    this.saveUsers(users);

    return { user };
  },

  // Admin creating another user
  adminCreateUser(username: string, pass: string, role: UserRole, creatorId: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const email = `${username.trim().toLowerCase()}@localapp.com`;

    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Usuário já existe.' };
    }

    const newId = 'usr_' + Math.random().toString(36).substring(2, 11);
    const userPasswords = JSON.parse(localStorage.getItem('gs_user_passwords') || '{}');
    userPasswords[email] = pass;
    localStorage.setItem('gs_user_passwords', JSON.stringify(userPasswords));

    const newUser: User = {
      id: newId,
      name: username.trim(),
      email,
      role,
      created: new Date().toISOString(),
      last: new Date().toISOString(),
      ownerId: creatorId, // Under the creator's space
    };

    users.push(newUser);
    this.saveUsers(users);

    return { success: true };
  },

  // --- CREDENTIALS MANAGEMENT ---
  getCredentials(): Credential[] {
    const data = localStorage.getItem(CREDENTIALS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getCredentialsForUser(activeUser: User): Credential[] {
    const all = this.getCredentials();
    const ownerId = activeUser.ownerId || activeUser.id;
    return all.filter(c => c.ownerId === ownerId);
  },

  saveCredentials(credentials: Credential[]) {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  },

  // Add new credential
  addCredential(site: string, url: string, username: string, plainPass: string, activeUser: User): Credential {
    const credentials = this.getCredentials();
    const ownerId = activeUser.ownerId || activeUser.id;

    // Encrypt password using ownerId as master key
    const encryptedPass = CryptoJS.AES.encrypt(plainPass, ownerId).toString();

    const newCred: Credential = {
      id: 'cred_' + Math.random().toString(36).substring(2, 15),
      site: site.trim(),
      url: url.trim(),
      username: username.trim(),
      password: encryptedPass,
      createdAt: new Date().toISOString(),
      ownerId,
      userId: activeUser.id,
      createdBy: activeUser.id,
    };

    credentials.push(newCred);
    this.saveCredentials(credentials);
    return newCred;
  },

  // Update existing credential
  updateCredential(credId: string, site: string, url: string, username: string, plainPass: string, ownerId: string): boolean {
    const credentials = this.getCredentials();
    const index = credentials.findIndex(c => c.id === credId);

    if (index === -1) return false;

    const encryptedPass = CryptoJS.AES.encrypt(plainPass, ownerId).toString();

    credentials[index] = {
      ...credentials[index],
      site: site.trim(),
      url: url.trim(),
      username: username.trim(),
      password: encryptedPass,
    };

    this.saveCredentials(credentials);
    return true;
  },

  // Delete credential
  deleteCredential(credId: string): boolean {
    const credentials = this.getCredentials();
    const filtered = credentials.filter(c => c.id !== credId);

    if (filtered.length === credentials.length) {
      return false;
    }

    this.saveCredentials(filtered);
    return true;
  },

  // Helper to decrypt credentials
  decryptPassword(encryptedPass: string, ownerId: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPass, ownerId);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || 'Falha ao descriptografar';
    } catch (e) {
      return 'Erro na descriptografia';
    }
  }
};
