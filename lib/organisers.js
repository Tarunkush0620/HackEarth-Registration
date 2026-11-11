// 5 Authorized Organisers for WIE HackEarth 2.0
// Tarun Kushwaha = Super Admin (Full Edit & Management Access)
// Kritika Jha, Ansh Vashisth, Atharv Singh, Md Rahil = View Only

function getOrganisers() {
  return [
    {
      id: 'tarun',
      name: 'Tarun Kushwaha',
      pin: process.env.PIN_TARUN || '2601',
      role: 'super_admin',
    },
    {
      id: 'kritika',
      name: 'Kritika Jha',
      pin: process.env.PIN_KRITIKA || '2602',
      role: 'viewer',
    },
    {
      id: 'ansh',
      name: 'Ansh Vashisth',
      pin: process.env.PIN_ANSH || '2603',
      role: 'viewer',
    },
    {
      id: 'atharv',
      name: 'Atharv Singh',
      pin: process.env.PIN_ATHARV || '2604',
      role: 'viewer',
    },
    {
      id: 'rahil',
      name: 'Md Rahil',
      pin: process.env.PIN_RAHIL || '2605',
      role: 'viewer',
    },
  ];
}

function verifyOrganiserPin(pin) {
  const clean = String(pin || '').trim();
  if (!clean) return null;
  const list = getOrganisers();
  const match = list.find((o) => o.pin === clean);
  if (match) {
    return { id: match.id, name: match.name, role: match.role };
  }
  // Master committee passcode fallback
  const master = process.env.SCANNER_PASSCODE || process.env.ADMIN_KEY || 'hackearth2026';
  if (clean === master) {
    return { id: 'admin', name: 'Organising Committee', role: 'super_admin' };
  }
  return null;
}

module.exports = { getOrganisers, verifyOrganiserPin };
