import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.BACKEND_PUBLIC ||= path.resolve(__dirname, '../../wikiman-backend-php/public')
await import('./copy-to-backend.mjs')
