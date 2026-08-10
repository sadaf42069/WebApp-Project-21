import { JsonDatabase } from './database.js'
import { PostgresDatabase } from './postgres-database.js'

export function createDatabase(config) {
  const admin = {
    email: config.adminEmail,
    password: config.adminPassword,
    name: config.adminName,
  }

  if (config.databaseUrl) return new PostgresDatabase(config.databaseUrl, admin)
  if (config.isVercel) {
    throw new Error('DATABASE_URL must be configured for Vercel deployments.')
  }
  return new JsonDatabase(config.dataFile, admin)
}

