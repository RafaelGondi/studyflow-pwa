import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let crc = 0xFFFFFFFF
  for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function generatePNG(size) {
  const BG  = [139, 92, 246]  // violet #8b5cf6
  const W   = [255, 255, 255] // white

  const rowLen = 1 + size * 3
  const raw = Buffer.alloc(size * rowLen)

  // Fill with violet
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const i = y * rowLen + 1 + x * 3
      raw[i] = BG[0]; raw[i+1] = BG[1]; raw[i+2] = BG[2]
    }
  }

  // Draw a rounded rect background (slightly lighter) — inner padding 18%
  const pad = Math.round(size * 0.18)
  function setPixel(x, y, color) {
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const i = y * rowLen + 1 + x * 3
    raw[i] = color[0]; raw[i+1] = color[1]; raw[i+2] = color[2]
  }

  // Draw a simple open-book shape in white
  const cx = size / 2
  const cy = size / 2
  const bookW = size * 0.52
  const bookH = size * 0.38
  const spineW = size * 0.04

  // Left page
  for (let y = Math.round(cy - bookH/2); y <= Math.round(cy + bookH/2); y++) {
    for (let x = Math.round(cx - bookW/2); x <= Math.round(cx - spineW/2); x++) {
      setPixel(x, y, W)
    }
  }
  // Right page
  for (let y = Math.round(cy - bookH/2); y <= Math.round(cy + bookH/2); y++) {
    for (let x = Math.round(cx + spineW/2); x <= Math.round(cx + bookW/2); x++) {
      setPixel(x, y, W)
    }
  }
  // Spine (slightly transparent — same as bg to create gap)
  for (let y = Math.round(cy - bookH/2); y <= Math.round(cy + bookH/2); y++) {
    for (let x = Math.round(cx - spineW/2); x <= Math.round(cx + spineW/2); x++) {
      setPixel(x, y, BG)
    }
  }
  // Lines on left page
  const lineColor = [180, 140, 255]
  const linesStart = Math.round(cx - bookW/2 + size * 0.05)
  const linesEnd   = Math.round(cx - spineW/2 - size * 0.03)
  for (let l = 0; l < 4; l++) {
    const ly = Math.round(cy - bookH/2 + size * 0.10 + l * size * 0.08)
    for (let x = linesStart; x <= linesEnd; x++) setPixel(x, ly, lineColor)
    if (size >= 256) { // thicker lines for large icon
      for (let x = linesStart; x <= linesEnd; x++) setPixel(x, ly+1, lineColor)
    }
  }
  // Lines on right page
  const rLinesStart = Math.round(cx + spineW/2 + size * 0.03)
  const rLinesEnd   = Math.round(cx + bookW/2 - size * 0.05)
  for (let l = 0; l < 4; l++) {
    const ly = Math.round(cy - bookH/2 + size * 0.10 + l * size * 0.08)
    for (let x = rLinesStart; x <= rLinesEnd; x++) setPixel(x, ly, lineColor)
    if (size >= 256) {
      for (let x = rLinesStart; x <= rLinesEnd; x++) setPixel(x, ly+1, lineColor)
    }
  }

  const compressed = deflateSync(raw)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
writeFileSync('public/pwa-192x192.png', generatePNG(192))
writeFileSync('public/pwa-512x512.png', generatePNG(512))
console.log('✓ pwa-192x192.png e pwa-512x512.png gerados em public/')
