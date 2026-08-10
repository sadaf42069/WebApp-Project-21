import { createApp } from './app.js'
import { createConfig } from './config.js'
import { createDatabase } from './services/database-factory.js'

const config = createConfig()
const database = createDatabase(config)

await database.initialize()
const app = await createApp({ database, config })

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`Navana Node.js API listening on http://localhost:${config.port}`)
  if (!process.env.AUTH_SECRET) {
    console.warn('AUTH_SECRET is using the development default. Set it before deployment.')
  }
})

function shutdown(signal) {
  console.log(`${signal} received; closing the API server.`)
  server.close(async () => {
    await database.close?.()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
