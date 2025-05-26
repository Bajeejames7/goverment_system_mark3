import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yxohiprngidbubkpeola.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4b2hpcHJuZ2lkYnVia3Blb2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNzU4NzgsImV4cCI6MjA2Mzg1MTg3OH0.FJk6YsLMdMPbogch9pn3xpj92MnHtNVRkvaHM94UkMs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication helpers
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

// Document storage helpers
export const uploadDocument = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file);
    
  if (error) throw error;
  return data;
};

export const getDocumentUrl = (path: string) => {
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(path);
    
  return data.publicUrl;
};