import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

const DUMMY_PROS = [
  { name: 'John Electric', service: 'Electrical', city: 'Miami', status: 'Active', subscription: 'Stripe ✅', background: 'Passed ✅' },
  { name: 'Sarah Clean', service: 'House Cleaning', city: 'Atlanta', status: 'Pending', subscription: 'Unpaid ❌', background: 'Pending ⏳' },
];

const DUMMY_LEADS = [
  { homeowner: 'Mike R.', city: 'Phoenix', service: 'Plumbing', time: '2 hours ago' },
  { homeowner: 'Anna B.', city: 'Dallas', service: 'Junk Removal', time: 'Today at 9AM' },
];

export default function AdminDashboard() {
  const [pros, setPros] = useState([]);
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPros(DUMMY_PROS);  // Replace with API call later
    setLeads(DUMMY_LEADS);
  }, []);

  const filteredPros = pros.filter((pro) =>
    pro.name.toLowerCase().includes(search.toLowerCase()) ||
    pro.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">🛠️ Fixlo Admin Dashboard</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Pro Directory</h2>
        <Input placeholder="Search pros by name or service" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {filteredPros.map((pro, index) => (
            <Card key={index}>
              <CardContent className="space-y-1">
                <p><strong>{pro.name}</strong> – {pro.service} ({pro.city})</p>
                <p>Status: {pro.status}</p>
                <p>Stripe: {pro.subscription}</p>
                <p>Checkr: {pro.background}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Latest Service Leads</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead, index) => (
            <Card key={index}>
              <CardContent>
                <p><strong>{lead.homeowner}</strong> requested <strong>{lead.service}</strong></p>
                <p>{lead.city} – {lead.time}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}