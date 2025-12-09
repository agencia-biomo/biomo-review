import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let app: App | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;
let initialized = false;

// Check if using emulator
const USE_EMULATOR = process.env.USE_FIREBASE_EMULATOR === 'true';

function initializeFirebaseAdmin() {
  if (initialized) {
    return { app, db, storage };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;

  // For emulator mode, we don't need credentials
  if (USE_EMULATOR) {
    // Set emulator environment variables
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

    try {
      if (getApps().length === 0) {
        app = initializeApp({
          projectId: projectId || 'barbearia-biomo',
        });
      } else {
        app = getApps()[0];
      }

      db = getFirestore(app);
      storage = getStorage(app);
      initialized = true;
      console.log('Firebase Admin connected to emulators');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin with emulator:', error);
      initialized = true;
    }

    return { app, db, storage };
  }

  // Production mode - requires credentials
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin SDK credentials not configured. API routes will not work.');
    initialized = true;
    return { app: null, db: null, storage: null };
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      app = getApps()[0];
    }

    db = getFirestore(app);
    storage = getStorage(app);
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    initialized = true;
  }

  return { app, db, storage };
}

// Lazy getters
export const getAdminDb = (): Firestore => {
  const { db } = initializeFirebaseAdmin();
  if (!db) {
    throw new Error('Firebase Admin not initialized. Check your credentials.');
  }
  return db;
};

export const getAdminStorage = (): Storage => {
  const { storage } = initializeFirebaseAdmin();
  if (!storage) {
    throw new Error('Firebase Admin not initialized. Check your credentials.');
  }
  return storage;
};

export const getAdminApp = (): App => {
  const { app } = initializeFirebaseAdmin();
  if (!app) {
    throw new Error('Firebase Admin not initialized. Check your credentials.');
  }
  return app;
};

// For backward compatibility - will throw if not configured
export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    return getAdminDb()[prop as keyof Firestore];
  },
});

export const adminStorage = new Proxy({} as Storage, {
  get(_, prop) {
    return getAdminStorage()[prop as keyof Storage];
  },
});

export const adminApp = new Proxy({} as App, {
  get(_, prop) {
    return getAdminApp()[prop as keyof App];
  },
});
