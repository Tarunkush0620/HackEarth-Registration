require('./env');
const nodemailer = require('nodemailer');
const { TRACKS, EVENT_NAME, EVENT_DATES, EVENT_VENUE, FEE_INR } = require('./config');
const { buildInvoicePdf } = require('./invoice');

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass },
    });
  }
  return transporter;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function html(reg, { qrSrc } = {}) {
  const teamId = reg.team_id || (reg.team_number ? String(reg.team_number).padStart(3, '0') : '001');
  const track = (TRACKS.find((t) => t.id === reg.track) || {}).label || reg.track;
  const baseFee = reg.is_all_female ? 200 : FEE_INR;
  const stayCount = Number(reg.stay_count) || (reg.need_stay ? reg.members.length : 0);
  const stayFee = reg.need_stay ? stayCount * 1500 : 0;
  const totalPaid = reg.amount_paise ? Math.round(reg.amount_paise / 100) : (baseFee + stayFee);
  const paymentId = reg.razorpay_payment_id || 'pay_online_verified';
  const paymentDate = reg.paid_at ? new Date(reg.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const rows = reg.members
    .map((m, i) => `<tr>
      <td style="padding:6px 12px 6px 0;color:#6b5f93;vertical-align:top">${i === 0 ? 'Leader' : `Member ${i + 1}`}</td>
      <td style="padding:6px 0;line-height:1.4">
        <b>${esc(m.name)}</b> &lt;${esc(m.email)}&gt; <span style="font-size:12px;color:#6b5f93">(${esc(m.gender || 'student')})</span><br/>
        <span style="font-size:12px;color:#b8337f;font-weight:600">Roll/ID:</span> <span style="font-size:12px;font-family:monospace;color:#33266b">${esc(m.rollNumber || 'N/A')}</span> &nbsp;·&nbsp;
        <span style="font-size:12px;color:#6b5f93">Mobile:</span> <span style="font-size:12px;color:#33266b">${esc(m.phone || 'N/A')}</span>
      </td>
    </tr>`)
    .join('');

  const stayRowHtml = reg.need_stay ? `
      <tr style="border-bottom:1px solid #f0ecf7">
        <td style="padding:8px 6px">
          <b>Stay &amp; Accommodation + University Shuttle</b><br/>
          <span style="font-size:11px;color:#6b5f93">Designated outstation venue + Galgotias University campus pick-up &amp; drop</span>
        </td>
        <td style="padding:8px 6px;text-align:center">${stayCount}</td>
        <td style="padding:8px 6px;text-align:right">₹1,500</td>
        <td style="padding:8px 6px;text-align:right;font-weight:600">₹${stayFee}</td>
      </tr>` : '';

  return `<!doctype html><html><body style="margin:0;background:#fcf7eb;font-family:Arial,Helvetica,sans-serif;color:#33266b">
<div style="max-width:580px;margin:0 auto;padding:28px 20px">
  <h1 style="font-family:Georgia,serif;font-size:28px;margin:0 0 4px"><span style="color:#b8337f">WIE</span> HackEarth 2.0</h1>
  <p style="margin:0 0 20px;color:#6b5f93">Registration &amp; Booking Confirmed</p>
  <p style="font-size:16px;line-height:1.5">Hi ${esc(reg.leader_name)}, payment of <b>₹${totalPaid}</b> for team <b>${esc(reg.team_name)} (Team #${esc(teamId)})</b> is received.${reg.is_all_female ? ' <span style="background:#e6dcf3;color:#33266b;padding:3px 8px;border-radius:6px;font-size:13px;font-weight:600">🎉 All-Women Team Discount (₹200 off)</span>' : ''} Your team is officially confirmed for the offline final.</p>

  <div style="text-align:center;margin:24px 0">
    <img src="${qrSrc || 'cid:rsvp-qr'}" alt="RSVP QR for ${esc(reg.team_name)}" width="380" style="max-width:100%;height:auto;border-radius:16px;box-shadow:0 4px 16px rgba(51,38,107,0.12)"/>
  </div>

  <table style="font-size:14px;border-collapse:collapse;margin-bottom:18px;width:100%">
    <tr><td style="padding:4px 12px 4px 0;color:#6b5f93;width:35%">Team ID</td><td><b style="color:#33266b;background:#e6dcf3;padding:2px 8px;border-radius:4px;font-size:15px">TEAM #${esc(teamId)}</b></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b5f93">Registration ID</td><td><b>${esc(reg.reg_code)}</b></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b5f93">Track</td><td>${esc(track)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b5f93">Team Type</td><td>${reg.is_all_female ? 'All-Women Team (₹200 Concession)' : 'Standard Team (₹400)'}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b5f93">Dates</td><td>${esc(EVENT_DATES)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b5f93">Venue</td><td>${esc(EVENT_VENUE)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b5f93">Accommodation &amp; Shuttle</td><td><b>${reg.need_stay ? `Booked for ${stayCount} member(s) (Shuttle Included)` : 'Not requested (Local / Own stay)'}</b></td></tr>
    ${reg.emergency_phone ? `<tr><td style="padding:4px 12px 4px 0;color:#b8337f">Emergency Contact</td><td><b>${esc(reg.emergency_name || 'Parent')} (${esc(reg.emergency_relation || 'Parent')})</b>: ${esc(reg.emergency_phone)}</td></tr>` : ''}
    ${rows}
  </table>

  ${reg.need_stay ? `
  <!-- ACCOMMODATION & SHUTTLE PASS VOUCHER -->
  <div style="margin:24px 0;background:#1e1435;color:#ffffff;border-radius:12px;padding:20px;border:2px solid #2dd4bf;box-shadow:0 4px 14px rgba(30,20,53,0.3)">
    <div style="border-bottom:1px solid rgba(45,212,191,0.3);padding-bottom:12px;margin-bottom:14px">
      <span style="display:inline-block;background:#2dd4bf;color:#1e1435;font-weight:700;font-size:11px;padding:2px 8px;border-radius:4px;letter-spacing:1px;text-transform:uppercase">OFFICIAL VOUCHER</span>
      <h3 style="margin:6px 0 0;font-size:18px;color:#ffffff">🏨 Accommodation &amp; University Shuttle Pass</h3>
      <p style="margin:3px 0 0;font-size:12px;color:#a39bb8;font-family:monospace">Voucher ID: STAY-${esc(reg.reg_code)}</p>
    </div>

    <table style="width:100%;font-size:13px;color:#e6dcf3;margin-bottom:14px;border-collapse:collapse">
      <tr>
        <td style="padding:3px 0;color:#a39bb8;width:38%">Stay Allocation:</td>
        <td style="padding:3px 0;font-weight:600;color:#ffffff"><b>${stayCount} Guest(s) Confirmed</b></td>
      </tr>
      <tr>
        <td style="padding:3px 0;color:#a39bb8">Designated Stay Venue:</td>
        <td style="padding:3px 0;color:#ffffff">Designated partner hotel / guest house in Greater Noida (exact address dispatched 48h prior)</td>
      </tr>
      <tr>
        <td style="padding:3px 0;color:#a39bb8">University Shuttle:</td>
        <td style="padding:3px 0;color:#2dd4bf;font-weight:600">✓ Pick-up from accommodation venue to campus &amp; drop back included</td>
      </tr>
      <tr>
        <td style="padding:3px 0;color:#a39bb8">Event Dates:</td>
        <td style="padding:3px 0;color:#ffffff">${esc(EVENT_DATES)}</td>
      </tr>
    </table>

    <div style="background:rgba(255,255,255,0.06);border-left:3px solid #f472b6;padding:10px 12px;border-radius:4px;font-size:12px;line-height:1.5;color:#fce7f3">
      <b>⚠️ Mandatory Hotel Check-in Requirements:</b><br/>
      1. Every staying member <b>MUST carry an Original Government Photo ID</b> (Aadhaar / Passport / Voter ID / DL) for hotel and local police registration.<br/>
      2. Every member <b>MUST carry their Valid College Student ID Card</b>.<br/>
      3. Show your RSVP QR pass image on arrival to claim room keys and shuttle wristbands.
    </div>
  </div>
  ` : ''}

  <!-- ITEMIZED COLLEGE REIMBURSEMENT RECEIPT -->
  <div style="margin:28px 0;background:#ffffff;border:1px solid #d4c8e8;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(51,38,107,0.06)">
    <div style="border-bottom:2px dashed #e6dcf3;padding-bottom:14px;margin-bottom:14px">
      <div style="float:right;text-align:right">
        <span style="display:inline-block;background:#e7f7ed;color:#175c2c;font-weight:700;font-size:12px;padding:3px 8px;border-radius:4px;border:1px solid #a3e0b8">✓ PAID / SETTLED</span>
      </div>
      <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:#b8337f;text-transform:uppercase">Institutional Grant / Travel Claim</span>
      <h3 style="margin:4px 0 0;font-size:18px;color:#33266b">Payment Receipt &amp; Tax Invoice</h3>
      <div style="clear:both"></div>
    </div>

    <table style="width:100%;font-size:13px;color:#33266b;margin-bottom:14px;border-collapse:collapse">
      <tr>
        <td style="padding:3px 0;color:#6b5f93;width:35%">Receipt No:</td>
        <td style="padding:3px 0;font-weight:600">INV-${esc(reg.reg_code)}</td>
      </tr>
      <tr>
        <td style="padding:3px 0;color:#6b5f93">Payment Date:</td>
        <td style="padding:3px 0">${paymentDate}</td>
      </tr>
      <tr>
        <td style="padding:3px 0;color:#6b5f93">Transaction / Payment ID:</td>
        <td style="padding:3px 0;font-family:monospace;font-size:12px;font-weight:600;color:#33266b">${esc(paymentId)}</td>
      </tr>
      <tr>
        <td style="padding:3px 0;color:#6b5f93">Order ID:</td>
        <td style="padding:3px 0;font-family:monospace;font-size:12px;color:#6b5f93">${esc(reg.razorpay_order_id || 'N/A')}</td>
      </tr>
      <tr>
        <td style="padding:3px 0;color:#6b5f93">Billed To:</td>
        <td style="padding:3px 0;font-weight:600">${esc(reg.leader_name)} · Team ${esc(reg.team_name)}</td>
      </tr>
      <tr>
        <td style="padding:3px 0;color:#6b5f93">College / University:</td>
        <td style="padding:3px 0;font-weight:600">${esc(reg.college || 'Participant College')}</td>
      </tr>
      <tr>
        <td style="padding:3px 0;color:#6b5f93">Organizers:</td>
        <td style="padding:3px 0">IEEE Women in Engineering · Galgotias University</td>
      </tr>
    </table>

    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-top:10px;border-top:1px solid #e6dcf3">
      <thead>
        <tr style="background:#f6f3fc;color:#33266b">
          <th style="padding:8px 6px;text-align:left;font-weight:600">Item Description</th>
          <th style="padding:8px 6px;text-align:center;font-weight:600;width:40px">Qty</th>
          <th style="padding:8px 6px;text-align:right;font-weight:600;width:70px">Rate</th>
          <th style="padding:8px 6px;text-align:right;font-weight:600;width:80px">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #f0ecf7">
          <td style="padding:8px 6px">
            <b>WIE HackEarth 2.0 Hackathon Registration</b><br/>
            <span style="font-size:11px;color:#6b5f93">${reg.is_all_female ? '★ All-Women Team Concession applied (₹200 discount)' : 'Standard Team Entry'} (${reg.members.length} members)</span>
          </td>
          <td style="padding:8px 6px;text-align:center">1</td>
          <td style="padding:8px 6px;text-align:right">₹${baseFee}</td>
          <td style="padding:8px 6px;text-align:right;font-weight:600">₹${baseFee}</td>
        </tr>
        ${stayRowHtml}
        <tr style="background:#faf8fd;border-top:2px solid #33266b">
          <td colspan="3" style="padding:10px 6px;text-align:right;font-weight:700;font-size:14px;color:#33266b">Total Paid:</td>
          <td style="padding:10px 6px;text-align:right;font-weight:700;font-size:15px;color:#b8337f">₹${totalPaid}</td>
        </tr>
      </tbody>
    </table>

    <p style="margin:12px 0 0;font-size:11px;color:#7a6f99;line-height:1.4;text-align:center">
      <i>* This is an electronically generated official payment receipt valid for college reimbursement, travel grants, and institutional audit claims.</i>
    </p>
  </div>

  <p style="font-size:14px;line-height:1.5"><b>At the venue:</b> show this QR (on your phone or printed) at the entry desk. One QR covers the whole team, so keep the image handy. It is also attached to this email.</p>
  <p style="font-size:13px;color:#6b5f93;line-height:1.5">Questions or need urgent assistance? Reply to this email.<br/>IEEE WIE Affinity Group · IEEE Galgotias University Student Branch</p>
</div></body></html>`;
}

async function sendConfirmation(reg, pngBuffer, pdfBuffer = null) {
  const to = reg.members.map((m) => m.email);
  const invoicePdf = pdfBuffer || (await buildInvoicePdf(reg));
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    replyTo: process.env.MAIL_REPLY_TO || undefined,
    to: to[0],
    cc: to.slice(1),
    subject: `You're in! ${EVENT_NAME} · Team ${reg.team_name} · RSVP Pass & Invoice`,
    text: `Payment received for team ${reg.team_name}. Registration ID: ${reg.reg_code}. Show the attached QR at the entry desk (${EVENT_DATES}, ${EVENT_VENUE}). Official invoice PDF is attached for college reimbursement.`,
    html: html(reg),
    attachments: [
      { filename: `HackEarth-RSVP-${reg.reg_code}.png`, content: pngBuffer, cid: 'rsvp-qr', contentType: 'image/png' },
      { filename: `HackEarth-Invoice-${reg.reg_code}.pdf`, content: invoicePdf, contentType: 'application/pdf' },
    ],
  });
}

module.exports = { sendConfirmation, html };
