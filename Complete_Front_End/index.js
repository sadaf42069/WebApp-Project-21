import { createApp } from './server/app.js'
import { createConfig } from './server/config.js'
import { createDatabase } from './server/services/database-factory.js'

const config = createConfig()
const database = createDatabase(config)

await database.initialize()

export default await createApp({ database, config })

