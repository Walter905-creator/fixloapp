import { useEffect, useState } from 'react';
import { postJSON, getJSON } from '../lib/api';

export default function ProDashboard(){
  const token = localStorage.getItem('fixlo_pro_token');
  const [photos, setPhotos] = useState([]);

  async function upload(file){
    try {
      // 1) get signed params
      const sig = await postJSON('/cloudinary/sign', { folder:'pros', transformation:'f_auto,q_auto,w_1200,h_900,c_limit' });

      // 2) upload to Cloudinary
      const form = new FormData();
      form.append('file', file);
      form.append('timestamp', sig.timestamp);
      form.append('api_key', sig.api_key);
      form.append('signature', sig.signature);
      form.append('folder', sig.folder);
      form.append('use_filename','true');
      form.append('unique_filename','true');
      form.append('transformation', sig.transformation);

      const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, { method:'POST', body: form });
      const json = await r.json();

      // 3) save photo URL to your backend (optional)
      // await postJSON('/pros/me/photos', { url: json.secure_url }, token);

      setPhotos(p => [json.secure_url, ...p]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
  }

  if(!token){ window.location.href='/pro/login'; return null; }

  return (
    <div className="container" style={{padding:'2rem 0'}}>
      <h1 className="text-2xl font-bold mb-4">Pro dashboard</h1>

      <label className="btn">
        <input type="file" accept="image/*" hidden onChange={e=>e.target.files[0] && upload(e.target.files[0])} />
        Upload photo
      </label>

      <div className="grid" style={{display:'grid',gap:'1rem',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', marginTop:'1rem'}}>
        {photos.map((src,i)=>(<img key={i} src={src} alt={`Work ${i+1}`} style={{borderRadius:'12px', width:'100%'}} />))}
      </div>
    </div>
  );
}