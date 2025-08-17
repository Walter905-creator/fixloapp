import React, { useState } from 'react';
import Seo from '../components/Seo';
import api from '../utils/api';

export default function Signup() {
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [photoUrl,setPhotoUrl] = useState('');
  const [status,setStatus] = useState('');

  async function getSignature() {
    const res = await fetch('/api/cloudinary/sign', { method:'POST' });
    if (!res.ok) throw new Error('Cannot get Cloudinary signature');
    return res.json();
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('Uploading image…');

    try {
      const { cloudName, apiKey, timestamp, signature, folder } = await getSignature();
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', apiKey);
      form.append('timestamp', timestamp);
      form.append('signature', signature);
      form.append('folder', folder);
      form.append('upload_preset', ''); // not needed when signed

      const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form
      });
      const data = await r.json();
      if (data.secure_url) {
        // optimized delivery with q_auto,f_auto
        const optimized = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
        setPhotoUrl(optimized);
        setStatus('Upload complete.');
      } else {
        throw new Error('Cloudinary upload failed');
      }
    } catch (err) {
      console.error(err);
      setStatus('Upload failed.');
    }
  }

  async function submit(e){
    e.preventDefault();
    setStatus('Submitting…');
    try {
      await api.post('/pros/signup', { name, email, photoUrl });
      setStatus('Signup successful. Check your email!');
    } catch (err) {
      console.error(err);
      setStatus('Signup failed.');
    }
  }

  return (
    <main style={{maxWidth:720,margin:'32px auto',padding:'0 16px'}}>
      <Seo 
        path="/signup"
        title="Sign Up | Fixlo"
        description="Join Fixlo as a homeowner to book trusted home service professionals. Sign up for free and get connected with verified local pros."
      />
      <h1>Professional Signup</h1>
      <form onSubmit={submit} style={{display:'grid',gap:12,marginTop:16}}>
        <label>Name<input value={name} onChange={e=>setName(e.target.value)} required/></label>
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
        <label>Profile Photo<input type="file" accept="image/*" onChange={handleUpload} /></label>
        {photoUrl && <img src={photoUrl} alt="Uploaded profile" style={{maxWidth:240,borderRadius:8}} />}
        <button type="submit">Create Account</button>
        <div aria-live="polite">{status}</div>
      </form>
    </main>
  );
}