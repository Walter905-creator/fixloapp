import React from 'react';
const list = ['Plumbing','Electrical','HVAC','Carpentry','Painting','Roofing','House Cleaning','Junk Removal','Landscaping'];
export default function Services(){
  return (
    <div>
      <h2>Popular services</h2>
      <ul>
        {list.map(s => <li key={s}>{s}</li>)}
      </ul>
    </div>
  );
}
