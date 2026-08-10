import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const processes = [
  spawn(process.execPath, ['--watch', 'server/index.js'], { cwd: projectDirectory, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0'], { cwd: projectDirectory, stdio: 'inherit' }),
]

let stopping = false

function stop(exitCode = 0) {
  if (stopping) return
  stopping = true
  for (const child of processes) child.kill()
  process.exitCode = exitCode
}

for (const child of processes) {
  child.on('exit', (code, signal) => {
    if (!stopping && signal !== 'SIGTERM') stop(code ?? 1)
  })
}

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())

