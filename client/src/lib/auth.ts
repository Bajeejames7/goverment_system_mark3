import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebase";

export const loginWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const createUserWithEmail = async (email: string, password: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  return result.user;
};

export const logout = async () => {
  await signOut(auth);
};

export const getCurrentUserRole = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const token = await user.getIdTokenResult();
  return token.claims.role as string | undefined;
};

export const getCurrentUserClaims = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const token = await user.getIdTokenResult();
  return token.claims;
};
