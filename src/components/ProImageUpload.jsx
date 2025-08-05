import React, { useState } from 'react';
import axios from 'axios';

function ProImageUpload() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/upload', formData);
      setImageUrl(res.data.url);
    } catch (err) {
      alert('Upload failed');
    }
  };

  return (
    <div>
      <h2>Upload Profile or Work Image</h2>
      <input type="file" onChange={handleChange} />
      <button onClick={handleUpload}>Upload</button>
      {imageUrl && <img src={imageUrl} alt="Uploaded" width="200" />}
    </div>
  );
}

export default ProImageUpload;