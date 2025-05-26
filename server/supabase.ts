import { createClient } from '@supabase/supabase-js';

// We'll need these environment variables from your Supabase project
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

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