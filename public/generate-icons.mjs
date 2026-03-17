import { writeFileSync } from 'fs';

function generateSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29"/>
      <stop offset="50%" style="stop-color:#302b63"/>
      <stop offset="100%" style="stop-color:#24243e"/>
    </linearGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a78bfa"/>
      <stop offset="100%" style="stop-color:#60a5fa"/>
    </linearGradient>
    <radialGradient id="circle" cx="40%" cy="40%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.38}" fill="none" stroke="url(#ring)" stroke-width="${size*0.04}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.28}" fill="url(#circle)"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial" font-weight="bold" font-size="${size*0.28}" fill="white" text-anchor="middle" dominant-baseline="middle">AI</text>
</svg>`;
}

writeFileSync('public/icon-192.svg', generateSVG(192));
writeFileSync('public/icon-512.svg', generateSVG(512));
console.log('✅ Icons generated!');