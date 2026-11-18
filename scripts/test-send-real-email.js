// Test sending a real confirmation email with RSVP QR and PDF Invoice attached
require('../lib/env');
const { buildCard } = require('../lib/qr');
const { buildInvoicePdf } = require('../lib/invoice');
const { sendConfirmation } = require('../lib/mailer');

async function main() {
  console.log('====================================================');
  console.log('   WIE HackEarth 2.0 - Real Email Dispatch Test      ');
  console.log('====================================================');

  const testReg = {
    id: 1,
    team_number: 1,
    team_id: '001',
    reg_code: 'HE26-LIVE01',
    team_name: 'Neural Queens (Test)',
    track: 'ai-social-good',
    idea_title: 'AI Soil Nutrient Mapper',
    college: 'Galgotias University',
    city: 'Greater Noida',
    unstop_team_id: 'UNSTOP-99120',
    leader_name: 'Tarun Kushwaha',
    leader_email: 'tarun.24scse1180294@galgotiasuniversity.ac.in',
    leader_phone: '9876543210',
    emergency_name: 'Rajesh Sharma',
    emergency_relation: 'Parent',
    emergency_phone: '9811223344',
    members: [
      { name: 'Tarun Kushwaha', email: 'tarun.24scse1180294@galgotiasuniversity.ac.in', gender: 'male', phone: '9876543210', rollNumber: '24SCSE1180294' },
      { name: 'IEEE Galgotias SB', email: 'ieeegusb@galgotiasuniversity.edu.in', gender: 'female', phone: '9876543211', rollNumber: 'IEEE-GU-01' },
    ],
    amount_paise: 470000,
    is_all_female: false,
    need_stay: true,
    stay_count: 2,
    stay_fee_paise: 300000,
    razorpay_order_id: 'order_live_test_01',
    razorpay_payment_id: 'pay_live_test_01',
    status: 'paid',
    paid_at: new Date().toISOString(),
  };

  console.log('1. Generating RSVP QR Pass card (PNG)...');
  const png = await buildCard({
    teamName: testReg.team_name,
    regCode: testReg.reg_code,
    trackId: testReg.track,
    isAllFemale: testReg.is_all_female,
    needStay: testReg.need_stay,
    stayCount: testReg.stay_count,
    teamId: testReg.team_id,
  });
  console.log('   ✓ QR Pass generated (' + png.length + ' bytes)');

  console.log('2. Generating Official Tax Invoice (PDF)...');
  const pdf = await buildInvoicePdf(testReg);
  console.log('   ✓ PDF Invoice generated (' + pdf.length + ' bytes)');

  console.log('3. Sending email via smtp.gmail.com to:');
  console.log('   - To: ' + testReg.members[0].email);
  console.log('   - CC: ' + testReg.members[1].email);

  await sendConfirmation(testReg, png, pdf);

  console.log('\n====================================================');
  console.log('🎉 SUCCESS! Real confirmation email has been dispatched!');
  console.log('👉 Check your inbox at:');
  console.log('   1. tarun.24scse1180294@galgotiasuniversity.ac.in');
  console.log('   2. ieeegusb@galgotiasuniversity.edu.in (Inbox & Sent folder)');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('❌ Failed to send email:', err);
  process.exit(1);
});

