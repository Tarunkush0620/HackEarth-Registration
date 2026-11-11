const path = require('path');
const PDFDocument = require('pdfkit');
const { TRACKS, EVENT_NAME, EVENT_DATES, EVENT_VENUE, FEE_INR } = require('./config');

const FONT_REG = path.join(__dirname, '..', 'assets', 'fonts', 'Poppins-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'assets', 'fonts', 'Poppins-SemiBold.ttf');

/**
 * Builds a vector PDF invoice & payment receipt buffer.
 * Suitable for university reimbursement, travel grants, and academic audits.
 * @param {object} reg - Registration record
 * @returns {Promise<Buffer>} PDF buffer
 */
function buildInvoicePdf(reg) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Invoice ${reg.reg_code} - WIE HackEarth 2.0`,
          Author: 'IEEE Women in Engineering - Galgotias University',
          Subject: 'Payment Receipt and Tax Invoice',
        },
      });

      // Register TTF fonts for clean Unicode glyph rendering (Rupee symbol, clean kerning)
      doc.registerFont('Poppins', FONT_REG);
      doc.registerFont('Poppins-Bold', FONT_BOLD);

      const buffers = [];
      doc.on('data', (b) => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const teamId = reg.team_id || (reg.team_number ? String(reg.team_number).padStart(3, '0') : (typeof reg.id === 'number' ? String(reg.id).padStart(3, '0') : '001'));
      const track = (TRACKS.find((t) => t.id === reg.track) || {}).label || reg.track || 'General';
      const baseFee = reg.is_all_female ? 200 : FEE_INR;
      const stayCount = Number(reg.stay_count) || (reg.need_stay ? (reg.members || []).length : 0);
      const stayFee = reg.need_stay ? stayCount * 1500 : 0;
      const totalPaid = reg.amount_paise ? Math.round(reg.amount_paise / 100) : (baseFee + stayFee);
      const paymentId = reg.razorpay_payment_id || 'pay_online_verified';
      const orderId = reg.razorpay_order_id || 'order_online_verified';
      const paymentDate = reg.paid_at
        ? new Date(reg.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // Colors matching WIE HackEarth theme
      const cMagenta = '#b8337f';
      const cIndigo = '#33266b';
      const cDark = '#1f1646';
      const cMuted = '#6b5f93';
      const cBorder = '#e6dcf3';
      const cGreen = '#175c2c';
      const cGreenBg = '#e7f7ed';

      // --- HEADER BAR ---
      doc.rect(40, 40, 515, 6).fill(cMagenta);

      // --- BRANDING & HEADER ---
      let y = 56;
      doc.font('Poppins-Bold').fontSize(16).fillColor(cDark).text('IEEE Women in Engineering', 40, y);
      doc.font('Poppins').fontSize(9).fillColor(cMuted).text('Galgotias University Student Branch · Greater Noida, UP 203201', 40, y + 22);

      // Right-aligned status pill
      doc.roundedRect(420, y + 2, 135, 26, 6).fillAndStroke(cGreenBg, '#a3e0b8');
      doc.font('Poppins-Bold').fontSize(10).fillColor(cGreen).text('PAID / SETTLED', 420, y + 8, { width: 135, align: 'center' });

      y = 100;
      doc.moveTo(40, y).lineTo(555, y).strokeColor(cBorder).lineWidth(1).stroke();

      // --- TITLE ---
      y = 112;
      doc.font('Poppins-Bold').fontSize(15).fillColor(cIndigo).text('PAYMENT RECEIPT & TAX INVOICE', 40, y);
      doc.font('Poppins').fontSize(8.5).fillColor(cMuted).text('Official electronic receipt for college travel grants & institutional reimbursement', 40, y + 18);

      // --- METADATA TWO-COLUMN BOX ---
      y = 146;
      doc.roundedRect(40, y, 515, 88, 8).fillAndStroke('#fcfbfe', cBorder);

      // Left column: Invoice & Payment details
      const col1X = 55;
      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cMuted).text('RECEIPT NO:', col1X, y + 11);
      doc.font('Poppins-Bold').fontSize(9.5).fillColor(cDark).text(`INV-${reg.reg_code}`, col1X + 80, y + 10);

      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cMuted).text('TEAM ID:', col1X, y + 27);
      doc.font('Poppins-Bold').fontSize(9.5).fillColor(cMagenta).text(`TEAM #${teamId}`, col1X + 80, y + 26);

      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cMuted).text('DATE:', col1X, y + 43);
      doc.font('Poppins').fontSize(8.5).fillColor(cDark).text(paymentDate, col1X + 80, y + 43);

      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cMuted).text('PAYMENT ID:', col1X, y + 59);
      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cIndigo).text(paymentId, col1X + 80, y + 59);

      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cMuted).text('ORDER ID:', col1X, y + 73);
      doc.font('Poppins').fontSize(8).fillColor(cMuted).text(orderId, col1X + 80, y + 73);

      // Right column: Billed To (Student & College)
      const col2X = 300;
      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cMuted).text('BILLED TO:', col2X, y + 11);
      doc.font('Poppins-Bold').fontSize(9).fillColor(cDark).text(`${reg.leader_name} (Leader)`, col2X + 65, y + 11);

      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cMuted).text('TEAM NAME:', col2X, y + 27);
      doc.font('Poppins-Bold').fontSize(9).fillColor(cDark).text(reg.team_name, col2X + 65, y + 27);

      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cMuted).text('COLLEGE:', col2X, y + 43);
      doc.font('Poppins').fontSize(8.5).fillColor(cDark).text(reg.college || 'Participant Institution', col2X + 65, y + 43, { width: 175 });

      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cMuted).text('TRACK:', col2X, y + 62);
      doc.font('Poppins').fontSize(8.5).fillColor(cDark).text(track, col2X + 65, y + 62, { width: 175 });

      // --- ITEMIZED TABLE ---
      y = 248;
      // Header
      doc.rect(40, y, 515, 24).fill(cDark);
      doc.font('Poppins-Bold').fontSize(8.5).fillColor('#ffffff');
      doc.text('#', 50, y + 7, { width: 20 });
      doc.text('DESCRIPTION', 80, y + 7, { width: 260 });
      doc.text('QTY', 350, y + 7, { width: 40, align: 'center' });
      doc.text('RATE (INR)', 400, y + 7, { width: 65, align: 'right' });
      doc.text('AMOUNT (INR)', 475, y + 7, { width: 70, align: 'right' });

      // Row 1: Registration
      y += 24;
      doc.rect(40, y, 515, 38).fillAndStroke('#ffffff', '#f0ecf7');
      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cDark).text('1', 50, y + 8);
      doc.text('WIE HackEarth 2.0 Hackathon Team Registration', 80, y + 8);
      const regSubtext = reg.is_all_female
        ? 'Special All-Women Team Concession applied (Rs. 200 discount)'
        : `Standard Team Entry (${(reg.members || []).length} participating members)`;
      doc.font('Poppins').fontSize(8).fillColor(reg.is_all_female ? cMagenta : cMuted).text(regSubtext, 80, y + 22);

      doc.font('Poppins').fontSize(8.5).fillColor(cDark).text('1 Team', 350, y + 12, { width: 40, align: 'center' });
      doc.text(`₹${baseFee}`, 400, y + 12, { width: 65, align: 'right' });
      doc.font('Poppins-Bold').text(`₹${baseFee}`, 475, y + 12, { width: 70, align: 'right' });

      // Row 2: Stay & Shuttle (if applicable)
      y += 38;
      if (reg.need_stay) {
        doc.rect(40, y, 515, 42).fillAndStroke('#fcfbfe', '#f0ecf7');
        doc.font('Poppins-Bold').fontSize(8.5).fillColor(cDark).text('2', 50, y + 8);
        doc.text('Stay & Accommodation + University Shuttle Service', 80, y + 8);
        doc.font('Poppins').fontSize(8).fillColor(cMuted).text('Designated Greater Noida stay + Galgotias campus pickup & drop-back', 80, y + 22);

        doc.font('Poppins').fontSize(8.5).fillColor(cDark).text(`${stayCount} Guests`, 350, y + 12, { width: 40, align: 'center' });
        doc.text('₹1,500', 400, y + 12, { width: 65, align: 'right' });
        doc.font('Poppins-Bold').text(`₹${stayFee}`, 475, y + 12, { width: 70, align: 'right' });
        y += 42;
      }

      // Total Row
      doc.rect(40, y, 515, 30).fillAndStroke('#f6f3fc', cBorder);
      doc.font('Poppins-Bold').fontSize(10.5).fillColor(cIndigo).text('TOTAL AMOUNT PAID (INR):', 80, y + 9, { width: 380, align: 'right' });
      doc.font('Poppins-Bold').fontSize(11.5).fillColor(cMagenta).text(`₹${totalPaid}`, 475, y + 9, { width: 70, align: 'right' });

      // --- ACCOMMODATION VOUCHER BOX (if stayed) ---
      y += 42;
      if (reg.need_stay) {
        doc.roundedRect(40, y, 515, 96, 8).fillAndStroke('#1e1435', '#2dd4bf');

        // Header inside box
        doc.font('Poppins-Bold').fontSize(10.5).fillColor('#2dd4bf')
          .text('OFFICIAL ACCOMMODATION & SHUTTLE PASS VOUCHER', 55, y + 11);

        doc.font('Poppins-Bold').fontSize(9).fillColor('#ffffff')
          .text(`VOUCHER REF: STAY-${reg.reg_code}`, 350, y + 11, { width: 190, align: 'right' });

        doc.font('Poppins').fontSize(8.5).fillColor('#e6dcf3');
        doc.text(`• Stay Allocation    : ${stayCount} Guest(s) Confirmed for ${reg.team_name}`, 55, y + 31);
        doc.text(`• Designated Venue   : Designated partner hotel in Greater Noida (exact address dispatched 48h prior)`, 55, y + 45);
        doc.text(`• University Shuttle : Included (Free pickup from accommodation venue to campus & return drop-back)`, 55, y + 59);

        doc.font('Poppins-Bold').fontSize(8).fillColor('#fce7f3')
          .text('MANDATORY NOTICE: Every guest must present Original Govt Photo ID (Aadhaar/Passport/DL) + Physical College ID on arrival.', 55, y + 76, { width: 485 });

        y += 106;
      }

      // --- REGISTERED MEMBERS LIST ---
      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cDark).text(`REGISTERED TEAM MEMBERS · TEAM #${teamId} (STUDENT ID & CONTACT):`, 40, y);
      y += 14;
      const members = reg.members || [];
      const memberCols = members
        .map((m, idx) => `${idx + 1}. ${m.name} [Roll/ID: ${m.rollNumber || 'N/A'}] · Ph: ${m.phone || 'N/A'}`)
        .join('   |   ');
      doc.font('Poppins').fontSize(8).fillColor(cMuted).text(memberCols, 40, y, { width: 515 });

      if (reg.emergency_phone) {
        y += 16;
        doc.font('Poppins-Bold').fontSize(8).fillColor(cMagenta)
          .text(`Emergency Contact: ${reg.emergency_name || 'Parent'} (${reg.emergency_relation || 'Parent'}) · Ph: ${reg.emergency_phone}`, 40, y, { width: 515 });
      }

      // --- EVENT DATES & VENUE NOTICE ---
      y += 24;
      doc.roundedRect(40, y, 515, 34, 6).fill('#f9f8fc');
      doc.font('Poppins-Bold').fontSize(8.5).fillColor(cIndigo).text(`Event Dates: ${EVENT_DATES}  ·  Venue: ${EVENT_VENUE}`, 50, y + 7);
      doc.font('Poppins').fontSize(8).fillColor(cMuted).text('Show the attached RSVP QR Pass upon arrival at Galgotias University Entry Desk. One pass admits the full team.', 50, y + 19);

      // --- FOOTER & AUDIT CLAUSE ---
      y = 750;
      doc.moveTo(40, y).lineTo(555, y).strokeColor(cBorder).lineWidth(0.8).stroke();
      doc.font('Poppins').fontSize(7.5).fillColor(cMuted)
        .text('This is an electronically generated official tax invoice and payment receipt issued by IEEE WIE Affinity Group, Galgotias University. It requires no physical signature and is recognized for institutional student travel grants, academic budgets, and college reimbursement audits.', 40, y + 8, { width: 515, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { buildInvoicePdf };
