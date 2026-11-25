// Minimal typing for the parts of opentype.js used by build-brand.ts
declare module 'opentype.js' {
  interface PathCommand { type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number }
  interface Glyph { advanceWidth?: number; path: { commands: PathCommand[] } }
  interface Font { unitsPerEm: number; charToGlyph(ch: string): Glyph }
  const opentype: { parse(buffer: ArrayBuffer): Font }
  export default opentype
  export type { Font, Glyph }
}
