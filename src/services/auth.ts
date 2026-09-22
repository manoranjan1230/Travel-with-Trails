import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  assertFirebaseReady,
} from './firebase';

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
  role?: 'traveller' | 'admin' | 'guide';
};

export const CURRENT_USER_KEY =
  'travel-with-trails-current-user';

export const USERS_KEY =
  'travel-with-trails-users-v1';

export function isStrongPassword(
  value: string
): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(
    value
  );
}

export function isValidMobileNumber(
  value: string
): boolean {
  const clean = value
    .replace(/\D/g, '')
    .trim();

  return /^6\d{9}$/.test(clean);
}

export function hashPassword(
  value: string
): Promise<string> {
  return crypto.subtle
    .digest(
      'SHA-256',
      new TextEncoder().encode(value)
    )
    .then((buffer) =>
      Array.from(new Uint8Array(buffer))
        .map((byte) =>
          byte.toString(16).padStart(2, '0')
        )
        .join('')
    );
}

export function readUsers(): StoredUser[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(USERS_KEY) || '[]'
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

export function readCurrentUser(): CurrentUser | null {
  try {
    return JSON.parse(
      localStorage.getItem(
        CURRENT_USER_KEY
      ) || 'null'
    );
  } catch {
    return null;
  }
}

function saveCurrentUser(
  user: CurrentUser
): void {
  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(user)
  );

  window.dispatchEvent(
    new Event(
      'travel-with-trails-auth-changed'
    )
  );
}

export async function signUpWithFirebase({
  name,
  email,
  mobile,
  password,
  emergencyNumber,
  profileImageUrl,
  address,
}: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  emergencyNumber?: string;
  profileImageUrl?: string;
  address?: string;
}) {
  const firebaseError =
    assertFirebaseReady();

  if (
    firebaseError ||
    !auth ||
    !db
  ) {
    throw new Error(
      firebaseError ||
        'Firebase auth or firestore is not available.'
    );
  }

  const credential =
    await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

  const user = credential.user;

  const userRecord: StoredUser = {
    id: user.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    mobile: mobile
      .replace(/\D/g, '')
      .trim(),
    passwordHash:
      await hashPassword(password),
    emergencyNumber:
      emergencyNumber || '',
    profileImageUrl:
      profileImageUrl || '',
    address: address || '',
    role: 'traveller',
    provider: 'email',
    isActive: true,
    createdAt:
      new Date().toISOString(),
    updatedAt:
      new Date().toISOString(),
  };

  await setDoc(
    doc(db, 'users', user.uid),
    userRecord
  );

  saveCurrentUser({
    id: user.uid,
    name: userRecord.name,
    email: userRecord.email,
    mobile: userRecord.mobile,
    emergencyNumber:
      userRecord.emergencyNumber,
    profileImageUrl:
      userRecord.profileImageUrl,
    address: userRecord.address,
    role: userRecord.role,
  });

  return user;
}

export async function loginWithFirebase(
  email: string,
  password: string
) {
  const firebaseError =
    assertFirebaseReady();

  if (
    firebaseError ||
    !auth ||
    !db
  ) {
    throw new Error(
      firebaseError ||
        'Firebase auth or firestore is not available.'
    );
  }

  const credential =
    await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

  const firebaseUser =
    credential.user;

  const userRef = doc(
    db,
    'users',
    firebaseUser.uid
  );

  const userDoc =
    await getDoc(userRef);

  if (!userDoc.exists()) {
    /*
     * Firebase Authentication succeeded,
     * but the application profile document
     * is missing. Create a minimal profile
     * so local auth state stays consistent.
     */
    const userRecord: StoredUser = {
      id: firebaseUser.uid,
      name:
        firebaseUser.displayName ||
        'Traveller',
      email:
        firebaseUser.email ||
        email.trim().toLowerCase(),
      mobile: '',
      passwordHash: '',
      role: 'traveller',
      provider: 'email',
      isActive: true,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    };

    await setDoc(
      userRef,
      userRecord
    );

    saveCurrentUser({
      id: firebaseUser.uid,
      name: userRecord.name,
      email: userRecord.email,
      mobile: userRecord.mobile,
      emergencyNumber:
        userRecord.emergencyNumber,
      profileImageUrl:
        userRecord.profileImageUrl,
      address: userRecord.address,
      role: userRecord.role,
    });

    return firebaseUser;
  }

  const data =
    userDoc.data() as StoredUser;

  saveCurrentUser({
    id: firebaseUser.uid,
    name:
      data.name ||
      firebaseUser.displayName ||
      'Traveller',
    email:
      data.email ||
      firebaseUser.email ||
      email.trim().toLowerCase(),
    mobile: data.mobile || '',
    emergencyNumber:
      data.emergencyNumber || '',
    profileImageUrl:
      data.profileImageUrl || '',
    address: data.address || '',
    role:
      data.role || 'traveller',
  });

  return firebaseUser;
}

export async function signInWithGoogle() {
  const firebaseError =
    assertFirebaseReady();

  if (
    firebaseError ||
    !auth ||
    !db
  ) {
    throw new Error(
      firebaseError ||
        'Firebase auth or firestore is not available.'
    );
  }

  const provider =
    new GoogleAuthProvider();

  const credential =
    await signInWithPopup(
      auth,
      provider
    );

  const firebaseUser =
    credential.user;

  const userRef = doc(
    db,
    'users',
    firebaseUser.uid
  );

  const userDoc =
    await getDoc(userRef);

  let data: StoredUser;

  if (!userDoc.exists()) {
    data = {
      id: firebaseUser.uid,
      name:
        firebaseUser.displayName ||
        'Google Traveller',
      email:
        firebaseUser.email || '',
      mobile: '',
      passwordHash: '',
      profileImageUrl:
        firebaseUser.photoURL || '',
      role: 'traveller',
      provider: 'google',
      isActive: true,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    };

    await setDoc(
      userRef,
      data
    );
  } else {
    data =
      userDoc.data() as StoredUser;
  }

  saveCurrentUser({
    id: firebaseUser.uid,
    name:
      data.name ||
      firebaseUser.displayName ||
      'Google Traveller',
    email:
      data.email ||
      firebaseUser.email ||
      '',
    mobile: data.mobile || '',
    emergencyNumber:
      data.emergencyNumber || '',
    profileImageUrl:
      data.profileImageUrl ||
      firebaseUser.photoURL ||
      '',
    address: data.address || '',
    role:
      data.role || 'traveller',
  });

  return firebaseUser;
}

export async function signOut() {
  if (auth) {
    await firebaseSignOut(auth);
  }

  localStorage.removeItem(
    CURRENT_USER_KEY
  );

  window.dispatchEvent(
    new Event(
      'travel-with-trails-auth-changed'
    )
  );
}

export async function findUserByEmail(
  email: string
) {
  if (!db) {
    return null;
  }

  if (!auth?.currentUser) {
    throw new Error(
      'Authentication required to search users.'
    );
  }

  const cleanEmail =
    email.trim().toLowerCase();

  const currentUserRef = doc(
    db,
    'users',
    auth.currentUser.uid
  );

  const currentUserDoc =
    await getDoc(currentUserRef);

  if (!currentUserDoc.exists()) {
    throw new Error(
      'Your user profile could not be found.'
    );
  }

  const currentUser =
    currentUserDoc.data() as StoredUser;

  /*
   * The current Firestore rules do not allow
   * a normal traveller to query the complete
   * users collection. Admins can perform the
   * collection query.
   */
  if (currentUser.role !== 'admin') {
    if (
      currentUser.email === cleanEmail
    ) {
      return {
        ...currentUser,
        id: auth.currentUser.uid,
      };
    }

    return null;
  }

  const q = query(
    collection(db, 'users'),
    where(
      'email',
      '==',
      cleanEmail
    )
  );

  const snapshot =
    await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const docSnapshot =
    snapshot.docs[0];

  const docData =
    docSnapshot.data() as StoredUser;

  return {
    ...docData,
    id: docSnapshot.id,
  };
}