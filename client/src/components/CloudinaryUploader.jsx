import React from 'react';
import { uploadToCloudinary } from '../utils/cloudinary';
export default function CloudinaryUploader({ onUploaded }){
  const [status, setStatus] = React.useState('');
  const [url, setUrl] = React.useState('');
  const onChange = async (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    setStatus('Uploading...');
    try{
      const out = await uploadToCloudinary(file);
      setUrl(out.secure_url);
      setStatus('Uploaded');
      onUploaded && onUploaded(out);
    }catch(err){
      setStatus(err.message);
    }
  };
  return (<div className="space-y-2">
    <input type="file" accept="image/*" onChange={onChange} className="block w-full text-sm" />
    {status && <div className="text-xs text-slate-400">{status}</div>}
    {url && <a className="text-xs" href={url} target="_blank" rel="noreferrer">View uploaded file</a>}
  </div>);
}
