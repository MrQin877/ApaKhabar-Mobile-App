# Welcome mascot asset

`ApaKhabar IP Mascot(1).svg` is the untouched source. Its 1254 x 1254 export
contains two embedded PNGs, a luminance mask built with two `feColorMatrix`
filters, and **two opaque white canvas paths**. It contains no CSS stylesheet,
external image references, clip paths, or unsupported element names in the
installed react-native-svg parser. Expo 58 bundles react-native-svg 15.16.0,
which is the installed version. `SvgUri` does not require an SVG transformer.

`apakhabar-mascot.png` is the Welcome page's 1254 x 1254 RGBA fallback. It
retains the original images, mask, transforms, colors, proportions, texture,
and shadow. Only the two white canvas paths were excluded so the app's
background and diagonal lines remain visible. On a white background the
rendered fallback and original SVG match exactly (maximum channel difference
0 across all pixels). No cropping, recoloring, tracing, or AI generation is used.
The PNG avoids the runtime URI fetch and native nested filter/mask composition.

Regenerate with a temporary conversion tool (no app dependency is required):

```powershell
npm install --prefix .tmp/mascot-render --no-save --package-lock=false @resvg/resvg-js
node scripts/render-welcome-mascot.cjs ./.tmp/mascot-render/node_modules/@resvg/resvg-js
node scripts/svg-rendering-regression.test.cjs
```

The converter checks dimensions, transparency, partial alpha, and the on-white
pixel comparison. The regression test fingerprints the source and output, so
intentional source changes require regenerating and reviewing the new asset.
Welcome uses React Native Image with `resizeMode="contain"`, square responsive
bounds and no tint. The logo, stripes, actions and surrounding layout are retained.
