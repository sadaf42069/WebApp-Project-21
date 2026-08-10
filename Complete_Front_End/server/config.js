import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(serverDirectory, '..')

try {
  process.loadEnvFile(path.join(projectDirectory, '.env'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function createConfig(overrides = {}) {
  return {
    port: positiveInteger(process.env.PORT, 3001),
    dataFile: process.env.DATA_FILE || path.join(serverDirectory, 'data', 'database.json'),
    databaseUrl: process.env.DATABASE_URL || '',
    authSecret: process.env.AUTH_SECRET || 'navana-development-secret-change-before-deployment',
    tokenTtlSeconds: positiveInteger(process.env.AUTH_TOKEN_TTL_SECONDS, 8 * 60 * 60),
    adminEmail: process.env.ADMIN_EMAIL || 'admin@navana.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
    adminName: process.env.ADMIN_NAME || 'System Administrator',
    corsOrigin: process.env.CORS_ORIGIN || '',
    isVercel: Boolean(process.env.VERCEL),
    staticDirectory: path.join(projectDirectory, 'dist'),
    ...overrides,
  }
}
