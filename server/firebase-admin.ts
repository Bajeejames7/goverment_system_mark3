import admin from "firebase-admin";

let app: admin.app.App;

try {
  // In production, use service account key from environment
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    // For development, try default credentials or create a minimal app
    app = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
    });
  }
} catch (error) {
  console.warn("Firebase Admin initialization failed:", error);
  // Create a mock app for development
  app = {} as admin.app.App;
}

export const auth = app.auth ? app.auth() : ({
  verifyIdToken: async () => ({ uid: "demo-uid", email: "demo@example.com" }),
  setCustomUserClaims: async () => {},
  createUser: async (userData: any) => ({ uid: "demo-uid", ...userData }),
} as any);

export const firestore = app.firestore ? app.firestore() : null;

export default app;
