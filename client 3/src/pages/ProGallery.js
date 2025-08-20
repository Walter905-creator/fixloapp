import React, { useState } from 'react';

export default function ProGallery(){
  const [files, setFiles] = useState([]);
  const handle = (e) => {
    setFiles([...e.target.files]);
  };
  return (
    <div>
      <h2>Pro Gallery (local preview)</h2>
      <input type="file" multiple accept="image/*" onChange={handle} />
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'12px', marginTop:'16px'}}>
        {files.map((f,i)=>{
          const url = URL.createObjectURL(f);
          return <img key={i} src={url} alt={f.name} style={{width:'100%', borderRadius:8}} />;
        })}
      </div>
    </div>
  );
}
