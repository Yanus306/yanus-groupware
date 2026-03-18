import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { resolve } from 'path'

const MAIN = 'C:/Users/jyt66/Desktop/yanus-groupware'
const ROOT = 'C:/Users/jyt66/Desktop/yanus-groupware/.claude/worktrees/awesome-nash'
process.chdir(ROOT)
process.argv[1] = resolve(MAIN, 'node_modules/vite/bin/vite.js')

await import('file:///' + MAIN.replace(/\\/g, '/') + '/node_modules/vite/bin/vite.js')
