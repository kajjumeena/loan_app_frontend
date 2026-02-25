const sharp = require('sharp');
const path = require('path');

const PRIMARY = '#6B46C1';

// App Icon (1024x1024) - Purple bg, just "Loan" + "Snap" text, no ₹ symbol
const iconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7C3AED"/>
      <stop offset="100%" style="stop-color:#553C9A"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="200" cy="150" r="200" fill="rgba(255,255,255,0.04)"/>
  <circle cx="850" cy="900" r="250" fill="rgba(255,255,255,0.03)"/>
  <circle cx="900" cy="100" r="120" fill="rgba(255,255,255,0.05)"/>

  <!-- "Loan" text - light weight, centered -->
  <text x="512" y="440" text-anchor="middle" font-size="200" font-weight="300" fill="white" font-family="Arial, Helvetica, sans-serif" letter-spacing="12">Loan</text>

  <!-- "Snap" text - bold, centered -->
  <text x="512" y="660" text-anchor="middle" font-size="200" font-weight="bold" fill="white" font-family="Arial, Helvetica, sans-serif" letter-spacing="12">Snap</text>
</svg>`;

// Adaptive Icon (1024x1024) - same but safe-zone adjusted
const adaptiveIconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7C3AED"/>
      <stop offset="100%" style="stop-color:#553C9A"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg2)"/>

  <!-- Decorative circles -->
  <circle cx="250" cy="200" r="180" fill="rgba(255,255,255,0.04)"/>
  <circle cx="800" cy="850" r="200" fill="rgba(255,255,255,0.03)"/>

  <!-- "Loan" text -->
  <text x="512" y="440" text-anchor="middle" font-size="180" font-weight="300" fill="white" font-family="Arial, Helvetica, sans-serif" letter-spacing="10">Loan</text>

  <!-- "Snap" text -->
  <text x="512" y="650" text-anchor="middle" font-size="180" font-weight="bold" fill="white" font-family="Arial, Helvetica, sans-serif" letter-spacing="10">Snap</text>
</svg>`;

// Splash screen (1284x2778)
const splashSvg = `
<svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgSplash" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7C3AED"/>
      <stop offset="50%" style="stop-color:#6B46C1"/>
      <stop offset="100%" style="stop-color:#553C9A"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1284" height="2778" fill="url(#bgSplash)"/>

  <!-- Decorative circles -->
  <circle cx="200" cy="400" r="350" fill="rgba(255,255,255,0.03)"/>
  <circle cx="1100" cy="600" r="280" fill="rgba(255,255,255,0.04)"/>
  <circle cx="300" cy="2200" r="400" fill="rgba(255,255,255,0.02)"/>
  <circle cx="1000" cy="2500" r="300" fill="rgba(255,255,255,0.03)"/>

  <!-- "Loan" text -->
  <text x="642" y="1280" text-anchor="middle" font-size="160" font-weight="300" fill="white" font-family="Arial, Helvetica, sans-serif" letter-spacing="14">Loan</text>

  <!-- "Snap" text -->
  <text x="642" y="1470" text-anchor="middle" font-size="160" font-weight="bold" fill="white" font-family="Arial, Helvetica, sans-serif" letter-spacing="14">Snap</text>

  <!-- Tagline -->
  <text x="642" y="1600" text-anchor="middle" font-size="40" fill="rgba(255,255,255,0.6)" font-family="Arial, Helvetica, sans-serif" letter-spacing="2">Instant loans, easy daily EMIs</text>
</svg>`;

async function generateIcons() {
  const assetsDir = path.join(__dirname, 'assets');

  try {
    await sharp(Buffer.from(iconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('icon.png created (1024x1024)');

    await sharp(Buffer.from(adaptiveIconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('adaptive-icon.png created (1024x1024)');

    await sharp(Buffer.from(splashSvg))
      .resize(1284, 2778)
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('splash.png created (1284x2778)');

    await sharp(Buffer.from(iconSvg))
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('favicon.png created (48x48)');

    console.log('\nAll icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
