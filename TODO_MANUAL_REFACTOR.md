You must now refactor the following files to remove all Firebase and Supabase logic:

- client/src/lib/auth.ts: Remove all firebase imports and logic. Replace with Aiven-based or custom auth.
- client/src/pages/Login.tsx: Remove all firebaseUser references and logic.
- server/routes.ts: Remove all firebase user creation and claims logic.
- server/storage.ts: Remove FirebaseStorage class and related logic.

Delete these files:
- client/src/lib/firebase.ts
- server/firebase-admin.ts
- server/supabase.ts

After these changes, test your app thoroughly to ensure only Aiven is used for authentication and storage.
