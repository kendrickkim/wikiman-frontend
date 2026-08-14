import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const svgPath = path.resolve(__dirname, '../public/icons/favicon.svg')
const outDir = path.resolve(__dirname, '../public/icons')

const pwaSizes = [128, 192, 256, 384, 512]
const appleSizes = [120, 152, 167, 180]
const msSizes = [144]

if (!fs.existsSync(svgPath)) {
  console.error('favicon.svg가 없습니다:', svgPath)
  process.exit(1)
}

const svg = fs.readFileSync(svgPath)
fs.mkdirSync(outDir, { recursive: true })

async function writePng(filename, size) {
  const out = path.join(outDir, filename)
  await sharp(svg, { density: Math.max(72, size * 2) })
    .resize(size, size)
    .png()
    .toFile(out)
  console.log('wrote', path.relative(process.cwd(), out))
}

for (const size of pwaSizes) {
  await writePng(`icon-${size}x${size}.png`, size)
}

for (const size of appleSizes) {
  await writePng(`apple-icon-${size}x${size}.png`, size)
}

await writePng('apple-touch-icon.png', 180)

for (const size of msSizes) {
  await writePng(`ms-icon-${size}x${size}.png`, size)
}
