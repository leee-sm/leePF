import fs from 'node:fs'
import path from 'node:path'

const [, , resultsPath, markdownPath, jsonPath] = process.argv
const rows = fs.existsSync(resultsPath)
  ? fs.readFileSync(resultsPath, 'utf8').trim().split('\n').filter(Boolean).map((line) => {
      const [name, status] = line.split('\t')
      return { name, status }
    })
  : []
const result = rows.some(({ status }) => status === 'FAIL') ? 'FAIL' : 'PASS'
const metadata = {
  commit: process.env.CI_COMMIT_SHA ?? 'local',
  branch: process.env.CI_COMMIT_REF_NAME ?? 'local',
  date: new Date().toISOString(),
  result,
  checks: rows,
}
fs.mkdirSync(path.dirname(markdownPath), { recursive: true })
const lines = [
  '# CI Summary', '', `Commit: ${metadata.commit}`, `Branch: ${metadata.branch}`, `Date: ${metadata.date}`, '',
  '## Result', '', result, '', '## Checks', '',
  ...rows.map(({ name, status }) => `- ${name}: ${status}`), '', '## Auto Fix', '',
  result === 'FAIL' ? 'See the failure analyzer artifact. Unsafe or ambiguous changes require human review.' : 'Not needed.',
]
fs.writeFileSync(markdownPath, `${lines.join('\n')}\n`)
fs.writeFileSync(jsonPath, `${JSON.stringify(metadata, null, 2)}\n`)
