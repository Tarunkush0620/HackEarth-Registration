// GET /api/export -> Downloads complete participant master roster as CSV (Organisers only)
const getDb = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { FIELDS, brief } = require('../lib/team');

function csvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

module.exports = async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const { data, error } = await getDb().from('registrations').select(FIELDS).order('created_at', { ascending: false });
    if (error) throw error;

    const rows = (data || []).map(brief);
    const headers = [
      'Team ID',
      'Reg Code',
      'Team Name',
      'Track',
      'Idea / Project Title',
      'College Name',
      'City',
      'Unstop Team ID',
      'Payment Status',
      'Total Paid (INR)',
      'All-Women Team',
      'Stay Confirmed',
      'Stay Guests Count',
      'Venue Checked In',
      'Admitted By Organiser',
      'Checked In Timestamp',
      'Members Present Count',
      'Total Members',
      'Leader Name',
      'Leader Mobile',
      'Leader Email',
      'Emergency Parent Name',
      'Emergency Relation',
      'Emergency Phone',
      'Member 1 Name',
      'Member 1 Roll No',
      'Member 1 Mobile',
      'Member 1 Attendance',
      'Member 2 Name',
      'Member 2 Roll No',
      'Member 2 Mobile',
      'Member 2 Attendance',
      'Member 3 Name',
      'Member 3 Roll No',
      'Member 3 Mobile',
      'Member 3 Attendance',
      'Member 4 Name',
      'Member 4 Roll No',
      'Member 4 Mobile',
      'Member 4 Attendance',
      'Razorpay Payment ID',
    ];

    const lines = [headers.join(',')];

    for (const r of rows) {
      const members = r.members || [];
      const m1 = members[0] || {};
      const m2 = members[1] || {};
      const m3 = members[2] || {};
      const m4 = members[3] || {};

      const attStr = (m) => (!m.name ? '' : (m.present ? 'PRESENT' : 'ABSENT'));

      const row = [
        csvCell(r.teamId || '001'),
        csvCell(r.code),
        csvCell(r.team),
        csvCell(r.track),
        csvCell(r.ideaTitle || ''),
        csvCell(r.college),
        csvCell(r.city || ''),
        csvCell(r.unstopTeamId || ''),
        csvCell(r.status || 'paid'),
        csvCell(r.amountInr),
        csvCell(r.isAllFemale ? 'Yes' : 'No'),
        csvCell(r.needStay ? 'Yes' : 'No'),
        csvCell(r.stayCount || 0),
        csvCell(r.checkedIn ? 'YES' : 'NO'),
        csvCell(r.checkedInBy || ''),
        csvCell(r.checkedInAt || ''),
        csvCell(r.presentCount),
        csvCell(r.totalMembers),
        csvCell(r.leaderName),
        csvCell(r.leaderPhone),
        csvCell(r.leaderEmail),
        csvCell(r.emergencyName || ''),
        csvCell(r.emergencyRelation || ''),
        csvCell(r.emergencyPhone || ''),
        csvCell(m1.name || ''),
        csvCell(m1.rollNumber || ''),
        csvCell(m1.phone || r.leaderPhone || ''),
        csvCell(attStr(m1)),
        csvCell(m2.name || ''),
        csvCell(m2.rollNumber || ''),
        csvCell(m2.phone || ''),
        csvCell(attStr(m2)),
        csvCell(m3.name || ''),
        csvCell(m3.rollNumber || ''),
        csvCell(m3.phone || ''),
        csvCell(attStr(m3)),
        csvCell(m4.name || ''),
        csvCell(m4.rollNumber || ''),
        csvCell(m4.phone || ''),
        csvCell(attStr(m4)),
        csvCell(r.razorpayPaymentId || ''),
      ];
      lines.push(row.join(','));
    }

    const csvContent = '\uFEFF' + lines.join('\r\n');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="WIE_HackEarth_2026_Master_Roster.csv"');
    res.setHeader('Cache-Control', 'no-store');
    res.end(csvContent);
  } catch (err) {
    console.error('export error:', err);
    res.statusCode = 500;
    res.end('Export failed');
  }
};
