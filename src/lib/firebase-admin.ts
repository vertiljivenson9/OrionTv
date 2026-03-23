import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

function getFirebaseAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return adminApp;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    console.warn('Firebase Admin credentials not configured properly');
    return null;
  }

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    });
    
    return adminApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return null;
  }
}

export function getAdminAuth() {
  const app = getFirebaseAdminApp();
  return app ? admin.auth(app) : null;
}

export function getAdminFirestore() {
  const app = getFirebaseAdminApp();
  return app ? admin.firestore(app) : null;
}

export { admin };
