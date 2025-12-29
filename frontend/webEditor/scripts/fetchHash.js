import { writeFileSync } from 'fs'
import { execSync } from 'child_process'

let hash = 'unknown'
try {
  hash = execSync('git rev-parse HEAD').toString().trim()
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Could not retrieve git hash:', e)
}
const filePath = 'src/settings/hash.json'
const fileContent = JSON.stringify({ hash })
writeFileSync(filePath, fileContent)