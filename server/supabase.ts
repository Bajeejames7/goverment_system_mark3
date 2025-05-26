import { createClient } from '@supabase/supabase-js';

// We'll need these environment variables from your Supabase project
const supabaseUrl = 'https://yxohiprngidbubkpeola.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4b2hpcHJuZ2lkYnVia3Blb2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNzU4NzgsImV4cCI6MjA2Mzg1MTg3OH0.FJk6YsLMdMPbogch9pn3xpj92MnHtNVRkvaHM94UkMs';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Create ICT Administrator in database
export async function createICTAdmin() {
  try {
    // First create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'jamesbajee3579@gmail.com',
      password: 'J@m3$b@j33',
      options: {
        data: {
          name: 'James Bajee'
        }
      }
    });

    if (authError) {
      console.log('Auth creation note:', authError.message);
    }

    // Create user record in our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        firebase_uid: authData?.user?.id || 'ict-admin-james-bajee',
        email: 'jamesbajee3579@gmail.com',
        name: 'James Bajee',
        role: 'admin',
        department: 'ICT',
        position: 'department_head',
        level: 0,
        can_assign_letters: true,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.log('User creation note:', userError.message);
    }

    return userData;
  } catch (error) {
    console.log('ICT admin setup note:', error);
    return null;
  }
}

// File upload function for documents
export async function uploadDocument(
  file: Buffer,
  fileName: string,
  fileType: string,
  folder: string = 'letters'
): Promise<{ path: string; url: string } | null> {
  try {
    const filePath = `${folder}/${Date.now()}-${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        contentType: fileType,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
}

// File deletion function
export async function deleteDocument(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    return !error;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

// Get signed URL for temporary access
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL exception:', error);
    return null;
  }
}