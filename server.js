const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// 1. Load environment variables from .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      } else if (val.includes('#')) {
        val = val.slice(0, val.indexOf('#')).trim();
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const PORT = Number(process.env.PORT) || 3000;
const { json, readJson } = require('./lib/http');
const { validate } = require('./lib/validate');
const { FEE_INR } = require('./lib/config');
const regCode = require('./lib/regcode');
const { buildCard } = require('./lib/qr');
const { buildInvoicePdf } = require('./lib/invoice');
const { issueToken, requireAuth, requireSuperAdmin, safeEqual } = require('./lib/auth');
const { brief } = require('./lib/team');
const { verifyOrganiserPin } = require('./lib/organisers');

// Detect if real Supabase & Razorpay credentials are configured
function isConfigured() {
  const sbUrl = process.env.SUPABASE_URL || '';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const rzpKey = process.env.RAZORPAY_KEY_ID || '';
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET || '';
  return (
    sbUrl && !sbUrl.includes('xxxx') && sbUrl.startsWith('http') &&
    sbKey && !sbKey.includes('...') &&
    rzpKey && !rzpKey.includes('xxxx') && rzpKey.startsWith('rzp_') &&
    rzpSecret && !rzpSecret.includes('xxxx')
  );
}

const mockMode = process.env.MOCK_PAYMENT === 'true' || (process.env.MOCK_PAYMENT !== 'false' && !isConfigured());

// In-memory store for local testing when credentials are not yet configured
const mockStore = new Map();

// Pre-seed mock store with sample registered teams for immediate scanner testing
mockStore.set('seed_1', {
  id: 1,
  team_number: 1,
  team_id: '001',
  reg_code: 'HE26-RJUF64',
  team_name: 'Neural Queens',
  track: 'ai-social-good',
  idea_title: 'AI Soil Nutrient Mapper',
  college: 'Indira Gandhi Delhi Technical University for Women',
  city: 'Delhi',
  unstop_team_id: 'UNSTOP-99120',
  leader_name: 'Priya Sharma',
  leader_email: 'priya@igdtuw.ac.in',
  leader_phone: '9876543210',
  emergency_name: 'Rajesh Sharma',
  emergency_relation: 'Father',
  emergency_phone: '9811223344',
  members: [
    { name: 'Priya Sharma', email: 'priya@igdtuw.ac.in', gender: 'female', phone: '9876543210', rollNumber: '21BCE10234' },
    { name: 'Ananya Verma', email: 'ananya@igdtuw.ac.in', gender: 'female', phone: '9876543211', rollNumber: '21BCE10235' },
    { name: 'Riya Gupta', email: 'riya@igdtuw.ac.in', gender: 'female', phone: '9876543212', rollNumber: '21BCE10236' },
  ],
  amount_paise: 470000,
  is_all_female: true,
  need_stay: true,
  stay_count: 3,
  stay_fee_paise: 450000,
  razorpay_order_id: 'order_seed_1',
  razorpay_payment_id: 'pay_mock_settled_1',
  status: 'paid',
  paid_at: new Date(Date.now() - 3600000).toISOString(),
  checked_in: false,
});

mockStore.set('seed_2', {
  id: 2,
  team_number: 2,
  team_id: '002',
  reg_code: 'HE26-GW8812',
  team_name: 'GreenWave',
  track: 'sustainability-climate',
  idea_title: 'IoT Carbon Offsetting Tracker',
  college: 'Galgotias University',
  city: 'Greater Noida',
  unstop_team_id: 'UNSTOP-44211',
  leader_name: 'Aarav Patel',
  leader_email: 'aarav@galgotias.edu',
  leader_phone: '9822334455',
  emergency_name: 'Sunil Patel',
  emergency_relation: 'Father',
  emergency_phone: '9899112233',
  members: [
    { name: 'Aarav Patel', email: 'aarav@galgotias.edu', gender: 'male', phone: '9822334455', rollNumber: 'GU22BTECH049' },
    { name: 'Tanvi Shah', email: 'tanvi@galgotias.edu', gender: 'female', phone: '9822334456', rollNumber: 'GU22BTECH050' },
  ],
  amount_paise: 40000,
  is_all_female: false,
  need_stay: false,
  stay_count: 0,
  stay_fee_paise: 0,
  razorpay_order_id: 'order_seed_2',
  razorpay_payment_id: 'pay_mock_settled_2',
  status: 'paid',
  paid_at: new Date(Date.now() - 7200000).toISOString(),
  checked_in: false,
});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // API routing
  if (pathname.startsWith('/api/')) {
    const route = pathname.replace(/^\/api\//, '').replace(/\.js$/, '');

    // Handle mock payment flows if running in mock/demo mode
    if (mockMode && route === 'create-order' && req.method === 'POST') {
      try {
        const { errors, data: d } = validate(await readJson(req));
        if (errors) return json(res, 422, { errors });

        const leader = d.members[0];
        const code = regCode();
        const feeInr = d.fee;
        const amount = d.amountPaise || (feeInr * 100);
        const orderId = 'order_mock_' + Date.now();

        const existingNums = [...mockStore.values()].map((r) => r.team_number || (r.team_id ? parseInt(r.team_id, 10) : 0)).filter(n => !isNaN(n) && n > 0);
        const nextNum = existingNums.length ? Math.max(...existingNums) + 1 : 1;
        const teamId = String(nextNum).padStart(3, '0');

        mockStore.set(orderId, {
          team_number: nextNum,
          team_id: teamId,
          reg_code: code,
          team_name: d.teamName,
          track: d.track,
          idea_title: d.ideaTitle,
          college: d.college,
          city: d.city,
          unstop_team_id: d.unstopTeamId,
          leader_name: leader.name,
          leader_email: leader.email,
          leader_phone: d.leaderPhone,
          emergency_name: d.emergencyName,
          emergency_relation: d.emergencyRelation,
          emergency_phone: d.emergencyPhone,
          members: d.members,
          amount_paise: amount,
          is_all_female: d.isAllFemale,
          need_stay: d.needStay,
          stay_count: d.stayCount,
          stay_fee_paise: d.stayFee * 100,
          razorpay_order_id: orderId,
          status: 'pending',
        });

        console.log(`[DEV MOCK] Created pending registration ${code} for team "${d.teamName}" [Team #${teamId}] (Total: ₹${feeInr}, All-Female: ${d.isAllFemale}, Stay: ${d.needStay ? d.stayCount + ' persons' : 'No'})`);
        return json(res, 200, {
          mock: true,
          keyId: 'rzp_test_mock',
          orderId,
          amount,
          fee: feeInr,
          regFee: d.regFee,
          stayFee: d.stayFee,
          needStay: d.needStay,
          stayCount: d.stayCount,
          isAllFemale: d.isAllFemale,
          currency: 'INR',
          teamId,
          teamNumber: nextNum,
          regCode: code,
          prefill: { name: leader.name, email: leader.email, contact: d.leaderPhone },
        });
      } catch (err) {
        console.error('Mock create-order error:', err);
        return json(res, 500, { error: 'Mock order creation failed' });
      }
    }

    if (mockMode && route === 'verify-payment' && req.method === 'POST') {
      try {
        const body = await readJson(req);
        const orderId = body.razorpay_order_id;
        const reg = mockStore.get(orderId);
        if (!reg) {
          return json(res, 404, { error: 'Registration not found for this order.' });
        }
        reg.status = 'paid';
        reg.razorpay_payment_id = body.razorpay_payment_id || ('pay_mock_' + Date.now());
        reg.paid_at = new Date().toISOString();

        const teamId = reg.team_id || (reg.team_number ? String(reg.team_number).padStart(3, '0') : '001');
        const [png, pdf] = await Promise.all([
          buildCard({
            teamName: reg.team_name,
            regCode: reg.reg_code,
            trackId: reg.track,
            isAllFemale: reg.is_all_female,
            needStay: reg.need_stay,
            stayCount: reg.stay_count,
            teamId,
          }),
          buildInvoicePdf(reg),
        ]);
        console.log(`[DEV MOCK] Verified payment and generated RSVP QR card & Invoice PDF for ${reg.reg_code} [Team #${teamId}] (All-Female: ${reg.is_all_female})`);

        return json(res, 200, {
          ok: true,
          teamId,
          teamNumber: reg.team_number || 1,
          regCode: reg.reg_code,
          teamName: reg.team_name,
          isAllFemale: reg.is_all_female,
          needStay: reg.need_stay,
          stayCount: reg.stay_count,
          fee: Math.round(reg.amount_paise / 100),
          emails: reg.members.map((m) => m.email),
          emailed: false,
          qr: `data:image/png;base64,${png.toString('base64')}`,
          invoicePdf: `data:application/pdf;base64,${pdf.toString('base64')}`,
        });
      } catch (err) {
        console.error('Mock verify-payment error:', err);
        return json(res, 500, { error: 'Mock payment verification failed' });
      }
    }

    // Scanner Desk API Mock Handlers
    if (mockMode && route === 'login' && req.method === 'POST') {
      try {
        const { passcode, pin } = await readJson(req);
        const inputPin = String(pin || passcode || '').trim();
        const organiser = verifyOrganiserPin(inputPin);
        if (!organiser) {
          await new Promise((r) => setTimeout(r, 600));
          return json(res, 401, { error: 'Invalid Organiser PIN. Access restricted to authorized organisers only.' });
        }
        return json(res, 200, {
          token: issueToken(14, organiser),
          organiser: { id: organiser.id, name: organiser.name, role: organiser.role },
        });
      } catch (err) {
        return json(res, 500, { error: 'Login error' });
      }
    }

    if (mockMode && route === 'stats' && req.method === 'GET') {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const list = [...mockStore.values()];
      const paid = list.filter((r) => r.status === 'paid');
      const checkedIn = paid.filter((r) => r.checked_in);
      return json(res, 200, {
        paid: paid.length,
        checkedIn: checkedIn.length,
        pending: paid.length - checkedIn.length,
        allFemale: paid.filter((r) => r.is_all_female).length,
        stayTeams: paid.filter((r) => r.need_stay).length,
        currentOrganiser: auth.name,
      });
    }

    if (mockMode && route === 'scan' && req.method === 'POST') {
      const auth = requireAuth(req, res);
      if (!auth) return;
      try {
        const body = await readJson(req);
        let code;
        if (body.payload) {
          const { parsePayload } = require('./lib/qr');
          const p = parsePayload(body.payload);
          if (!p) return json(res, 200, { status: 'invalid', note: 'QR signature does not match. Possible forged or expired QR pass.' });
          code = p.code;
        } else {
          const clean = String(body.code || '').trim().toUpperCase();
          const m = clean.match(/HE26-[A-Z0-9]{6}/);
          if (!m) return json(res, 200, { status: 'invalid', note: 'Invalid registration code format (expected HE26-XXXXXX).' });
          code = m[0];
        }

        const reg = [...mockStore.values()].find((r) => r.reg_code === code);
        if (!reg) return json(res, 200, { status: 'notfound', code });
        if (reg.status !== 'paid') return json(res, 200, { status: 'unpaid', ...brief(reg) });

        if (reg.checked_in) {
          return json(res, 200, { status: 'already', ...brief(reg) });
        }

        reg.checked_in = true;
        reg.checked_in_at = new Date().toISOString();
        reg.checked_in_by = auth.name;
        console.log(`[DEV MOCK] Checked in team "${reg.team_name}" (${reg.reg_code}) by organiser ${auth.name}`);
        return json(res, 200, { status: 'ok', ...brief(reg) });
      } catch (err) {
        console.error('Mock scan error:', err);
        return json(res, 500, { error: 'Mock scan error' });
      }
    }

    if (mockMode && route === 'search' && req.method === 'GET') {
      const auth = requireAuth(req, res);
      if (!auth) return;
      try {
        const q = String(parsedUrl.searchParams.get('q') || '').trim().toLowerCase();
        if (q.length < 2) return json(res, 200, { results: [] });

        const list = [...mockStore.values()].filter((r) => r.status === 'paid');
        const hit = list.filter((r) => {
          const memberTokens = (r.members || []).flatMap((m) => [m.name, m.email, m.phone, m.rollNumber]);
          const teamIdStr = r.team_id || (r.team_number ? String(r.team_number).padStart(3, '0') : '');
          const hay = [
            teamIdStr,
            teamIdStr ? `team ${teamIdStr}` : '',
            teamIdStr ? `team #${teamIdStr}` : '',
            r.team_name,
            r.reg_code,
            r.track,
            r.idea_title,
            r.college,
            r.city,
            r.unstop_team_id,
            r.leader_name,
            r.leader_email,
            r.leader_phone,
            r.emergency_name,
            r.emergency_phone,
            r.razorpay_payment_id,
            ...memberTokens,
          ].filter(Boolean).join(' ').toLowerCase();

          return hay.includes(q);
        }).slice(0, 25);

        return json(res, 200, { results: hit.map(brief) });
      } catch (err) {
        console.error('Mock search error:', err);
        return json(res, 500, { error: 'Mock search error' });
      }
    }

    if (mockMode && route === 'undo' && req.method === 'POST') {
      const auth = requireAuth(req, res);
      if (!auth) return;
      try {
        const body = await readJson(req);
        const code = String(body.code || '').trim().toUpperCase();
        const m = code.match(/HE26-[A-Z0-9]{6}/);
        if (!m) return json(res, 400, { error: 'Bad registration code format.' });

        const reg = [...mockStore.values()].find((r) => r.reg_code === m[0]);
        if (!reg || reg.status !== 'paid') return json(res, 404, { error: 'No paid team found with that code.' });

        reg.checked_in = false;
        reg.checked_in_at = null;
        reg.checked_in_by = null;
        console.log(`[DEV MOCK] Undid check-in for team "${reg.team_name}" (${reg.reg_code}) by organiser ${auth.name}`);
        return json(res, 200, { ok: true, ...brief(reg) });
      } catch (err) {
        console.error('Mock undo error:', err);
        return json(res, 500, { error: 'Mock undo error' });
      }
    }

    if (mockMode && route === 'update-team' && req.method === 'POST') {
      const auth = requireSuperAdmin(req, res);
      if (!auth) return;
      try {
        const body = await readJson(req);
        const code = String(body.code || '').trim().toUpperCase();
        const m = code.match(/HE26-[A-Z0-9]{6}/);
        if (!m) return json(res, 400, { error: 'Invalid registration code.' });

        const reg = [...mockStore.values()].find((r) => r.reg_code === m[0]);
        if (!reg) return json(res, 404, { error: 'Team not found.' });

        if (body.teamName) reg.team_name = String(body.teamName).trim();
        if (body.track) reg.track = String(body.track).trim();
        if (body.ideaTitle !== undefined) reg.idea_title = String(body.ideaTitle).trim();
        if (body.college) reg.college = String(body.college).trim();
        if (body.city !== undefined) reg.city = String(body.city).trim();
        if (body.unstopTeamId !== undefined) reg.unstop_team_id = String(body.unstopTeamId).trim();
        if (body.leaderPhone) reg.leader_phone = String(body.leaderPhone).trim();
        if (body.leaderEmail) reg.leader_email = String(body.leaderEmail).trim().toLowerCase();
        if (body.emergencyName !== undefined) reg.emergency_name = String(body.emergencyName).trim();
        if (body.emergencyRelation !== undefined) reg.emergency_relation = String(body.emergencyRelation).trim();
        if (body.emergencyPhone !== undefined) reg.emergency_phone = String(body.emergencyPhone).trim();
        if (body.needStay !== undefined) {
          reg.need_stay = Boolean(body.needStay);
          if (body.stayCount !== undefined) reg.stay_count = Number(body.stayCount) || 0;
        }
        if (Array.isArray(body.members) && body.members.length > 0) {
          reg.members = body.members.map((mem) => ({
            name: String(mem.name || '').trim(),
            email: String(mem.email || '').trim().toLowerCase(),
            gender: String(mem.gender || 'student').trim(),
            phone: String(mem.phone || '').trim(),
            rollNumber: String(mem.rollNumber || '').trim(),
          }));
        }
        console.log(`[DEV MOCK SUPER ADMIN] Record ${code} updated by ${auth.name}`);
        return json(res, 200, { ok: true, team: brief(reg) });
      } catch (err) {
        console.error('Mock update-team error:', err);
        return json(res, 500, { error: 'Failed to update record' });
      }
    }

    if (mockMode && route === 'attendance' && req.method === 'POST') {
      const auth = requireAuth(req, res);
      if (!auth) return;
      try {
        const body = await readJson(req);
        const code = String(body.code || '').trim().toUpperCase();
        const m = code.match(/HE26-[A-Z0-9]{6}/);
        if (!m) return json(res, 400, { error: 'Invalid registration code.' });

        const reg = [...mockStore.values()].find((r) => r.reg_code === m[0]);
        if (!reg) return json(res, 404, { error: 'Team not found.' });

        const members = reg.members || [];
        const attendanceList = body.attendance;
        if (Array.isArray(attendanceList)) {
          members.forEach((mem, idx) => {
            if (typeof attendanceList[idx] === 'boolean') {
              mem.present = attendanceList[idx];
            } else if (typeof attendanceList[idx] === 'object' && attendanceList[idx] !== null) {
              mem.present = attendanceList[idx].present !== false;
            }
          });
        }
        reg.checked_in_by = auth.name;
        console.log(`[DEV MOCK ATTENDANCE] Team ${code} attendance updated by ${auth.name}`);
        return json(res, 200, { ok: true, team: brief(reg) });
      } catch (err) {
        console.error('Mock attendance error:', err);
        return json(res, 500, { error: 'Failed to update attendance' });
      }
    }

    if (mockMode && route === 'export' && req.method === 'GET') {
      const auth = requireAuth(req, res);
      if (!auth) return;
      try {
        const list = [...mockStore.values()].map(brief);
        const headers = [
          'Team ID', 'Reg Code', 'Team Name', 'Track', 'Idea / Project Title', 'College Name', 'City', 'Unstop Team ID',
          'Payment Status', 'Total Paid (INR)', 'All-Women Team', 'Stay Confirmed', 'Stay Guests Count',
          'Venue Checked In', 'Admitted By Organiser', 'Checked In Timestamp', 'Members Present Count', 'Total Members',
          'Leader Name', 'Leader Mobile', 'Leader Email', 'Emergency Parent Name', 'Emergency Relation', 'Emergency Phone',
          'Member 1 Name', 'Member 1 Roll No', 'Member 1 Mobile', 'Member 1 Attendance',
          'Member 2 Name', 'Member 2 Roll No', 'Member 2 Mobile', 'Member 2 Attendance',
          'Member 3 Name', 'Member 3 Roll No', 'Member 3 Mobile', 'Member 3 Attendance',
          'Member 4 Name', 'Member 4 Roll No', 'Member 4 Mobile', 'Member 4 Attendance',
          'Razorpay Payment ID',
        ];
        function csvCell(val) {
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        }
        const lines = [headers.join(',')];
        for (const r of list) {
          const members = r.members || [];
          const m1 = members[0] || {};
          const m2 = members[1] || {};
          const m3 = members[2] || {};
          const m4 = members[3] || {};
          const attStr = (m) => (!m.name ? '' : (m.present ? 'PRESENT' : 'ABSENT'));
          const row = [
            csvCell(r.teamId || '001'), csvCell(r.code), csvCell(r.team), csvCell(r.track), csvCell(r.ideaTitle || ''), csvCell(r.college), csvCell(r.city || ''), csvCell(r.unstopTeamId || ''),
            csvCell(r.status || 'paid'), csvCell(r.amountInr),
            csvCell(r.isAllFemale ? 'Yes' : 'No'), csvCell(r.needStay ? 'Yes' : 'No'), csvCell(r.stayCount || 0),
            csvCell(r.checkedIn ? 'YES' : 'NO'), csvCell(r.checkedInBy || ''), csvCell(r.checkedInAt || ''),
            csvCell(r.presentCount), csvCell(r.totalMembers),
            csvCell(r.leaderName), csvCell(r.leaderPhone), csvCell(r.leaderEmail),
            csvCell(r.emergencyName || ''), csvCell(r.emergencyRelation || ''), csvCell(r.emergencyPhone || ''),
            csvCell(m1.name || ''), csvCell(m1.rollNumber || ''), csvCell(m1.phone || r.leaderPhone || ''), csvCell(attStr(m1)),
            csvCell(m2.name || ''), csvCell(m2.rollNumber || ''), csvCell(m2.phone || ''), csvCell(attStr(m2)),
            csvCell(m3.name || ''), csvCell(m3.rollNumber || ''), csvCell(m3.phone || ''), csvCell(attStr(m3)),
            csvCell(m4.name || ''), csvCell(m4.rollNumber || ''), csvCell(m4.phone || ''), csvCell(attStr(m4)),
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
        return;
      } catch (err) {
        console.error('Mock export error:', err);
        return json(res, 500, { error: 'Export failed' });
      }
    }

    if (mockMode && route === 'check-in') {
      try {
        if (req.method === 'GET') {
          const list = [...mockStore.values()];
          const paid = list.filter((r) => r.status === 'paid');
          const checkedIn = paid.filter((r) => r.checked_in);
          return json(res, 200, {
            totalPaid: paid.length,
            checkedIn: checkedIn.length,
            pendingCheckIn: paid.length - checkedIn.length,
            allFemaleTeams: paid.filter((r) => r.is_all_female).length,
            stayTeams: paid.filter((r) => r.need_stay).length,
          });
        }
        if (req.method === 'POST') {
          const body = await readJson(req);
          const { qrText, codeInput } = body;
          let regCode = null;
          if (qrText) {
            const { parsePayload } = require('./lib/qr');
            const parsed = parsePayload(qrText);
            if (!parsed) return json(res, 400, { error: 'Invalid or forged QR code signature. Do not admit.' });
            regCode = parsed.code;
          } else if (codeInput) {
            const m = String(codeInput).trim().toUpperCase().match(/HE26-[A-Z0-9]{6}/);
            if (!m) return json(res, 400, { error: 'Invalid registration code format (expected HE26-XXXXXX).' });
            regCode = m[0];
          } else {
            return json(res, 400, { error: 'Scan a QR or enter code.' });
          }

          let reg = [...mockStore.values()].find((r) => r.reg_code === regCode);
          if (!reg) return json(res, 404, { error: `No registration found for code ${regCode}.` });
          if (reg.status !== 'paid') return json(res, 402, { error: `Team "${reg.team_name}" has not paid yet.` });

          if (reg.checked_in) {
            return json(res, 200, {
              ok: true,
              alreadyCheckedIn: true,
              checkedInAt: reg.checked_in_at,
              team: {
                teamId: reg.team_id || (reg.team_number ? String(reg.team_number).padStart(3, '0') : '001'),
                regCode: reg.reg_code,
                teamName: reg.team_name,
                track: reg.track,
                college: reg.college,
                isAllFemale: reg.is_all_female,
                needStay: reg.need_stay,
                stayCount: reg.stay_count,
                leaderName: reg.leader_name,
                leaderPhone: reg.leader_phone,
                emergencyName: reg.emergency_name,
                emergencyRelation: reg.emergency_relation,
                emergencyPhone: reg.emergency_phone,
                members: reg.members,
              },
            });
          }

          reg.checked_in = true;
          reg.checked_in_at = new Date().toISOString();
          console.log(`[DEV MOCK] Checked in team "${reg.team_name}" (${reg.reg_code}) at venue desk`);

          return json(res, 200, {
            ok: true,
            alreadyCheckedIn: false,
            checkedInAt: reg.checked_in_at,
            team: {
              teamId: reg.team_id || (reg.team_number ? String(reg.team_number).padStart(3, '0') : '001'),
              regCode: reg.reg_code,
              teamName: reg.team_name,
              track: reg.track,
              college: reg.college,
              isAllFemale: reg.is_all_female,
              needStay: reg.need_stay,
              stayCount: reg.stay_count,
              leaderName: reg.leader_name,
              leaderPhone: reg.leader_phone,
              emergencyName: reg.emergency_name,
              emergencyRelation: reg.emergency_relation,
              emergencyPhone: reg.emergency_phone,
              members: reg.members,
            },
          });
        }
      } catch (err) {
        console.error('Mock check-in error:', err);
        return json(res, 500, { error: 'Mock check-in failed' });
      }
    }

    // Default Vercel API file handler
    const apiFilePath = path.join(__dirname, 'api', `${route}.js`);
    if (fs.existsSync(apiFilePath)) {
      try {
        const handler = require(apiFilePath);
        await handler(req, res);
      } catch (err) {
        console.error(`Error in /api/${route}:`, err);
        if (!res.headersSent) {
          json(res, 500, { error: 'Internal server error' });
        }
      }
      return;
    }

    return json(res, 404, { error: `API route /api/${route} not found` });
  }

  // Static file handling
  let relativePath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(__dirname, 'public', relativePath);

  // If file doesn't exist, check for clean .html URL (e.g. /terms -> /terms.html)
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Also allow assets/ if requested
  if (!fs.existsSync(filePath) && pathname.startsWith('/assets/')) {
    filePath = path.join(__dirname, pathname);
  }

  // Prevent path traversal
  const resolvedPublic = path.resolve(__dirname, 'public');
  const resolvedAssets = path.resolve(__dirname, 'assets');
  const resolvedTarget = path.resolve(filePath);

  if (!resolvedTarget.startsWith(resolvedPublic) && !resolvedTarget.startsWith(resolvedAssets)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('========================================================');
  console.log(`  WIE HackEarth 2.0 Web App is running!`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log('========================================================');
  if (mockMode) {
    console.log(`  Mode: TEST / DEMO MODE (Mock Payment enabled)`);
    console.log(`  -> Full form submission and QR generation works locally!`);
    console.log(`  -> Add your Supabase & Razorpay credentials to .env to use real payments.`);
  } else {
    console.log(`  Mode: PRODUCTION / LIVE (Connected to Supabase & Razorpay)`);
  }
  console.log('========================================================');
});

