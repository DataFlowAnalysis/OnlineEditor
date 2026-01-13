import { writeFileSync } from 'fs'
import { execSync } from 'child_process'

let hash = 'unknown'
try {
  hash = execSync('git rev-parse HEAD').toString().trim()
} catch (e) {
  // eslint-disable-next-line no-console, no-undef
  console.warn('Could not retrieve git hash:', e)
}
const filePath = 'src/helpUi/hash.json'
const fileContent = JSON.stringify({ hash })
writeFileSync(filePath, fileContent)