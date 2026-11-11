// Generate sample confirmation emails for:
// 1. Registration Only (Standard Team) -> sample-email-registration-only.html
// 2. Registration + Accommodation (Outstation Team) -> sample-email-with-accommodation.html

const fs = require('fs');
const path = require('path');
const { buildCard } = require('../lib/qr');
const { buildInvoicePdf } = require('../lib/invoice');
const { html } = require('../lib/mailer');

(async () => {
  const workspaceRoot = path.join(__dirname, '..');
  const publicDir = path.join(workspaceRoot, 'public');

  // ==========================================
  // Sample 1: Registration Only (Standard Team) - Team #001
  // ==========================================
  const regOnly = {
    team_number: 1,
    team_id: '001',
    reg_code: 'HE26-B8N2M4',
    team_name: 'Binary Beasts',
    track: 'smart-automation',
    college: 'Delhi Technological University',
    leader_name: 'Aman Verma',
    leader_email: 'aman.verma@example.com',
    leader_phone: '9876501234',
    emergency_name: 'Suresh Verma',
    emergency_relation: 'Parent',
    emergency_phone: '9811002233',
    members: [
      { name: 'Aman Verma', email: 'aman.verma@example.com', gender: 'male', phone: '9876501234', rollNumber: '21/DTU/CS/104' },
      { name: 'Rohit Sharma', email: 'rohit.sharma@example.com', gender: 'male', phone: '9876505678', rollNumber: '21/DTU/CS/142' },
      { name: 'Pooja Singh', email: 'pooja.singh@example.com', gender: 'female', phone: '9876509988', rollNumber: '21/DTU/IT/088' }
    ],
    is_all_female: false,
    need_stay: false,
    stay_count: 0,
    amount_paise: 40000, // ₹400
    razorpay_order_id: 'order_HE26_REG_982341',
    razorpay_payment_id: 'pay_QN8374928172',
    paid_at: new Date('2026-11-08T10:30:00Z').toISOString(),
  };

  const qrOnlyBuffer = await buildCard({
    teamName: regOnly.team_name,
    regCode: regOnly.reg_code,
    trackId: regOnly.track,
    isAllFemale: regOnly.is_all_female,
    needStay: regOnly.need_stay,
    stayCount: regOnly.stay_count,
    teamId: regOnly.team_id,
  });

  const pdfOnlyBuffer = await buildInvoicePdf(regOnly);

  const qrOnlyBase64 = `data:image/png;base64,${qrOnlyBuffer.toString('base64')}`;
  const htmlRegOnly = html(regOnly, { qrSrc: qrOnlyBase64 });

  const pathRegOnly = path.join(workspaceRoot, 'sample-email-registration-only.html');
  fs.writeFileSync(pathRegOnly, htmlRegOnly);
  fs.writeFileSync(path.join(publicDir, 'sample-email-registration-only.html'), htmlRegOnly);
  fs.writeFileSync(path.join(workspaceRoot, 'sample-invoice-registration-only.pdf'), pdfOnlyBuffer);
  console.log(`✓ Generated: ${pathRegOnly} & sample-invoice-registration-only.pdf`);

  // ==========================================
  // Sample 2: Registration + Stay & Shuttle - Team #002
  // ==========================================
  const regWithStay = {
    team_number: 2,
    team_id: '002',
    reg_code: 'HE26-RJUF64',
    team_name: 'Neural Queens',
    track: 'ai-social-good',
    college: 'Vellore Institute of Technology',
    leader_name: 'Priya Sharma',
    leader_email: 'priya.sharma@example.com',
    leader_phone: '9876543210',
    emergency_name: 'Dr. Alok Sharma',
    emergency_relation: 'Parent',
    emergency_phone: '9840112233',
    members: [
      { name: 'Priya Sharma', email: 'priya.sharma@example.com', gender: 'female', phone: '9876543210', rollNumber: '21BCE10234' },
      { name: 'Ananya Rao', email: 'ananya.rao@example.com', gender: 'female', phone: '9876543211', rollNumber: '21BCE10488' },
      { name: 'Sneha Patel', email: 'sneha.patel@example.com', gender: 'female', phone: '9876543212', rollNumber: '21BCE10901' }
    ],
    is_all_female: true, // ₹200 discount
    need_stay: true,     // 3 guests x ₹1500 = ₹4500
    stay_count: 3,
    amount_paise: 470000, // ₹4,700 total
    razorpay_order_id: 'order_HE26_STAY_549102',
    razorpay_payment_id: 'pay_RQ9182374650',
    paid_at: new Date('2026-11-08T12:45:00Z').toISOString(),
  };

  const qrWithStayBuffer = await buildCard({
    teamName: regWithStay.team_name,
    regCode: regWithStay.reg_code,
    trackId: regWithStay.track,
    isAllFemale: regWithStay.is_all_female,
    needStay: regWithStay.need_stay,
    stayCount: regWithStay.stay_count,
    teamId: regWithStay.team_id,
  });

  const pdfWithStayBuffer = await buildInvoicePdf(regWithStay);

  const qrWithStayBase64 = `data:image/png;base64,${qrWithStayBuffer.toString('base64')}`;
  const htmlWithStay = html(regWithStay, { qrSrc: qrWithStayBase64 });

  const pathWithStay = path.join(workspaceRoot, 'sample-email-with-accommodation.html');
  fs.writeFileSync(pathWithStay, htmlWithStay);
  fs.writeFileSync(path.join(publicDir, 'sample-email-with-accommodation.html'), htmlWithStay);
  fs.writeFileSync(path.join(workspaceRoot, 'sample-invoice-with-accommodation.pdf'), pdfWithStayBuffer);
  fs.writeFileSync(path.join(workspaceRoot, 'sample-rsvp-pass-with-accommodation.png'), qrWithStayBuffer);
  console.log(`✓ Generated: ${pathWithStay} & sample-invoice-with-accommodation.pdf & sample-rsvp-pass-with-accommodation.png`);
})();

