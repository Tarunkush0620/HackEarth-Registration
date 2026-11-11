require('./env');
module.exports = {
  EVENT_NAME: 'WIE HackEarth 2.0 · 2026',
  EVENT_DATES: process.env.EVENT_DATES || '29–30 Nov 2026',
  EVENT_VENUE: process.env.EVENT_VENUE || 'Galgotias University, Greater Noida',
  FEE_INR: Number(process.env.REG_FEE_INR || 400),
  ALL_FEMALE_FEE_INR: Number(process.env.ALL_FEMALE_FEE_INR || 200),
  ACCOMMODATION_FEE_PER_PERSON_INR: Number(process.env.ACCOMMODATION_FEE_PER_PERSON_INR || 1500),
  MIN_MEMBERS: 2,
  MAX_MEMBERS: 4,
  TRACKS: [
    { id: 'sustainability-climate', label: 'Sustainability & Climate' },
    { id: 'ai-social-good', label: 'AI for Social Good' },
    { id: 'health-wellbeing', label: 'Health & Well-being' },
    { id: 'smart-communities', label: 'Smart Communities' },
  ],
};
