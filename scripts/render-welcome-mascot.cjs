const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const rendererPath = process.argv[2] || '@resvg/resvg-js';
const { Resvg } = require(rendererPath.startsWith('.') ? path.resolve(rendererPath) : rendererPath);
const source = fs.readFileSync('assets/images/ApaKhabar IP Mascot(1).svg', 'utf8');
// The source export paints the same opaque white canvas twice, outside the
// mascot's masked artwork. Remove only those canvas rectangles for dark mode
// and the Welcome stripes; retain both images, the mask, filters and transforms.
let removed = 0;
const transparent = source.replace(/<path\b[^>]*\/>/g, element => {
  if (element.includes('d="M 0 0 L 940 0 L 940 940 L 0 940 Z M 0 0 "') && element.includes('fill="#ffffff"')) { removed++; return ''; }
  return element;
});
assert.equal(removed, 2, 'Review the SVG if its canvas paths change');
const reference = new Resvg(source, { background: '#ffffff' }).render();
const whiteResult = new Resvg(transparent, { background: '#ffffff' }).render();
const result = new Resvg(transparent).render();
assert.equal(result.width, 1254); assert.equal(result.height, 1254);
let maxDifference = 0, transparentPixels = 0, partialPixels = 0;
const original = reference.pixels, whitePixels = whiteResult.pixels, pixels = result.pixels;
for (let i = 0; i < pixels.length; i += 4) {
  if (pixels[i + 3] === 0) transparentPixels++;
  else if (pixels[i + 3] < 255) partialPixels++;
  for (let c = 0; c < 3; c++) {
    const white = whitePixels[i + c];
    const referenceWhite = original[i + c];
    maxDifference = Math.max(maxDifference, Math.abs(white - referenceWhite));
  }
}
assert.ok(transparentPixels > 0 && partialPixels > 0, 'Preserve transparent edges and shadow');
assert.ok(maxDifference <= 1, `Original on-white pixel difference: ${maxDifference}`);
const png = result.asPng();
fs.writeFileSync('assets/images/apakhabar-mascot.png', png);
console.log(JSON.stringify({ width: result.width, height: result.height, bytes: png.length, removedBackdropPaths: removed, maxWhiteCompositeDifference: maxDifference, transparentPixels, partialPixels, svgSha256: crypto.createHash('sha256').update(source).digest('hex'), pngSha256: crypto.createHash('sha256').update(png).digest('hex') }, null, 2));
