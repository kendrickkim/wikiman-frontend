import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.resolve(__dirname, '../dist/pwa')
const dest = process.env.BACKEND_PUBLIC
  ? path.resolve(process.env.BACKEND_PUBLIC)
  : path.resolve(__dirname, '../../backend/public')

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('프론트엔드 PWA 빌드 결과가 없습니다. quasar build -m pwa가 실패했는지 확인하세요.')
  process.exit(1)
}

if (!fs.existsSync(path.dirname(dest))) {
  console.log(`백엔드 public 경로가 없어 복사를 건너뜁니다: ${dest}`)
  console.log('dist/pwa 내용을 백엔드 public/ 에 직접 복사하세요.')
  process.exit(0)
}

const preserved = new Map()
for (const name of ['index.php', 'install.php', '.htaccess', '.wikiman-installed']) {
  const file = path.join(dest, name)
  if (fs.existsSync(file)) preserved.set(name, fs.readFileSync(file))
}

fs.rmSync(dest, { recursive: true, force: true })
fs.mkdirSync(dest, { recursive: true })
fs.cpSync(src, dest, { recursive: true })
for (const [name, content] of preserved) {
  fs.writeFileSync(path.join(dest, name), content)
}
console.log(`Copied frontend PWA build -> ${dest}`)
