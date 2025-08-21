import { useEffect, useState } from 'react';
import { postJSON, getJSON } from '../lib/api';

export default function ProDashboard(){
  const token = localStorage.getItem('fixlo_pro_token');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  async function upload(file){
    if (uploading) return;
    
    try {
      setUploading(true);
      
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

      if (!r.ok) {
        throw new Error(json.error?.message || 'Upload failed');
      }

      // 3) save photo URL to your backend (optional)
      // await postJSON('/pros/me/photos', { url: json.secure_url }, token);

      setPhotos(p => [json.secure_url, ...p]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  if(!token){ window.location.href='/pro/login'; return null; }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pro Dashboard</h1>
        <button 
          onClick={() => {
            localStorage.removeItem('fixlo_pro_token');
            localStorage.removeItem('fixlo_pro');
            window.location.href='/pro/login';
          }}
          className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
        >
          Logout
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Work Photos</h2>
        <label className={`inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input 
            type="file" 
            accept="image/*" 
            hidden 
            onChange={e=>e.target.files[0] && upload(e.target.files[0])}
            disabled={uploading}
          />
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </label>
      </div>

      {photos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Work Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((src,i)=>(
              <div key={i} className="aspect-square">
                <img 
                  src={src} 
                  alt={`Work ${i+1}`} 
                  className="w-full h-full object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow" 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}