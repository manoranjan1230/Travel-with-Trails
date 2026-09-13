import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, assertFirebaseReady } from './firebase';

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  address?: string;
  profileImageUrl?: string;
  emergencyNumber?: string;
  role?: 'traveller' | 'admin' | 'guide';
  provider?: 'email' | 'google' | 'phone';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CurrentUser = {
  id?: string;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  profileImageUrl?: string;
  emergencyNumber?: string;
};

export const CURRENT_USER_KEY = 'travel-with-trails-current-user';
export const USERS_KEY = 'travel-with-trails-users-v1';

export function isStrongPassword(value: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
}

export function isValidMobileNumber(value: string): boolean {
  const clean = value.replace(/\D/g, '').trim();
  return /^6\d{9}$/.test(clean);
}

export function hashPassword(value: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then((buffer) => Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join(''));
}

export function readUsers(): StoredUser[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readCurrentUser(): CurrentUser | null {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export async function signUpWithFirebase({ name, email, mobile, password, emergencyNumber, profileImageUrl, address }: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  emergencyNumber?: string;
  profileImageUrl?: string;
  address?: string;
}) {
  const firebaseError = assertFirebaseReady();
  if (firebaseError || !auth || !db) {
    throw new Error(firebaseError || 'Firebase auth or firestore is not available.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const userRecord: StoredUser = {
    id: user.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    mobile: mobile.replace(/\D/g, '').trim(),
    passwordHash: await hashPassword(password),
    emergencyNumber: emergencyNumber || '',
    profileImageUrl: profileImageUrl || '',
    address: address || '',
    role: 'traveller',
    provider: 'email',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', user.uid), userRecord);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: user.uid, name: userRecord.name, email: userRecord.email, mobile: userRecord.mobile, emergencyNumber: userRecord.emergencyNumber, profileImageUrl: userRecord.profileImageUrl, address: userRecord.address }));
  window.dispatchEvent(new Event('travel-with-trails-auth-changed'));
  return user;
}

export async function loginWithFirebase(email: string, password: string) {
  const firebaseError = assertFirebaseReady();
  if (firebaseError || !auth || !db) {
    throw new Error(firebaseError || 'Firebase auth or firestore is not available.');
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data() as StoredUser;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: credential.user.uid, name: data.name, email: data.email, mobile: data.mobile, emergencyNumber: data.emergencyNumber, profileImageUrl: data.profileImageUrl, address: data.address }));
  }
  window.dispatchEvent(new Event('travel-with-trails-auth-changed'));
  return credential.user;
}

export async function signInWithGoogle() {
  if (!auth || !db) {
    throw new Error('Firebase is not configured.');
  }

  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const firebaseUser = credential.user;
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

  if (!userDoc.exists()) {
    const userRecord: StoredUser = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Google Traveller',
      email: firebaseUser.email || '',
      mobile: '',
      passwordHash: '',
      profileImageUrl: firebaseUser.photoURL || '',
      role: 'traveller',
      provider: 'google',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', firebaseUser.uid), userRecord);
  }

  const data = userDoc.exists() ? userDoc.data() as StoredUser : (await getDoc(doc(db, 'users', firebaseUser.uid))).data() as StoredUser;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: firebaseUser.uid, name: data.name || firebaseUser.displayName || 'Google Traveller', email: data.email || firebaseUser.email, mobile: data.mobile || '', emergencyNumber: data.emergencyNumber || '', profileImageUrl: data.profileImageUrl || firebaseUser.photoURL || '', address: data.address || '' }));
  window.dispatchEvent(new Event('travel-with-trails-auth-changed'));
  return firebaseUser;
}

export async function signOut() {
  if (auth) {
    await firebaseSignOut(auth);
  }
  localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event('travel-with-trails-auth-changed'));
}

export async function findUserByEmail(email: string) {
  if (!db) return null;
  const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0].data();
  return { id: snapshot.docs[0].id, ...(docData as StoredUser) };
}

