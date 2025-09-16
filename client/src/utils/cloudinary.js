import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './config';

export async function uploadToCloudinary(file){
  const cloudName = CLOUDINARY_CLOUD_NAME;
  const uploadPreset = CLOUDINARY_UPLOAD_PRESET;
  if(!cloudName || !uploadPreset){
    throw new Error('Missing Cloudinary env. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);
  const res = await fetch(url, { method:'POST', body: form });
  if(!res.ok){ throw new Error('Cloudinary upload failed'); }
  return await res.json();
}
