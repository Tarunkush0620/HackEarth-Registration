// node scripts/preview-qr.js [teamName] [track-id] [is-all-female] [need-stay] [stay-count]
const fs = require('fs');
const path = require('path');
const { buildCard } = require('../lib/qr');

(async () => {
  const teamName = process.argv[2] || 'EcoCode Innovators';
  const trackId = process.argv[3] || 'ai-social-good';
  const isAllFemale = process.argv[4] === 'true' || process.argv[4] === '1' || process.argv[4] === undefined;
  const needStay = process.argv[5] !== 'false';
  const stayCount = Number(process.argv[6]) || 3;

  const pngWithStay = await buildCard({
    teamName,
    regCode: 'HE26-K7M2QX',
    trackId,
    isAllFemale,
    needStay: true,
    stayCount,
  });

  const workspaceRoot = path.join(__dirname, '..');
  const outDir = path.join(workspaceRoot, 'out');
  fs.mkdirSync(outDir, { recursive: true });

  // Save to workspace root so user can easily open it directly
  const samplePath = path.join(workspaceRoot, 'sample-rsvp-pass-with-accommodation.png');
  fs.writeFileSync(samplePath, pngWithStay);
  fs.writeFileSync(path.join(outDir, 'sample-accommodation-pass.png'), pngWithStay);
  console.log(`Saved sample pass with accommodation to: ${samplePath}`);

  // Also save a standard preview
  const pngStandard = await buildCard({
    teamName: 'Standard Team',
    regCode: 'HE26-AB12CD',
    trackId: 'open-innovation',
    isAllFemale: false,
    needStay: false,
  });
  fs.writeFileSync(path.join(outDir, 'preview-standard.png'), pngStandard);
  console.log('Saved standard pass to out/preview-standard.png');
})();
