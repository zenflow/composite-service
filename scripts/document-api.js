const { execSync } = require('child_process')
const { parse, join } = require('path')
const { promisify } = require('util')
const fs = require('fs')
const pkg = require('../package.json')
const [readdir, readFile, writeFile, unlink] = [
  fs.readdir,
  fs.readFile,
  fs.writeFile,
  fs.unlink,
].map(fn => promisify(fn))

main().catch(error => {
  console.error(error)
  process.exit(1)
})

async function main() {
  execSync(`api-extractor run --local`, { stdio: 'inherit' })
  const dir = 'docs/api'
  execSync(`api-documenter markdown -i temp -o ${dir}`, { stdio: 'inherit' })
  await unlink(`${dir}/index.md`)

  const mdFiles = (await readdir(dir))
    .filter(file => file.endsWith('.md'))
    .map(file => join(dir, file))

  await Promise.all(
    mdFiles.map(async file => {
      try {
        await processMdFile(file)
      } catch (error) {
        console.error(`Could not process ${file}: ${error}`)
      }
    })
  )
}

async function processMdFile(file) {
  let lines = (await readFile(file, 'utf8')).split(/\r?\n/)

  let title = ''
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/## (.*)/)
    if (match) {
      title = match[1]
      lines.splice(index, 1)
      break
    }
  }

  let sidebarLabel
  const [exportName, exportType] = title.split(' ')
  const exportNameParts = exportName.split('.')
  if (exportNameParts.length === 1) {
    sidebarLabel = title
  } else {
    sidebarLabel = `${exportNameParts.slice(1).join('.')} ${exportType}`
  }

  const homeRegexp = /\[Home\]\(.\/index\.md\) &gt; (.*)/
  const homeLineIndex = lines.findIndex(line => homeRegexp.test(line))
  if (parse(file).name === pkg.name) {
    lines.splice(homeLineIndex, 1)
  } else {
    lines[homeLineIndex] = lines[homeLineIndex].match(homeRegexp)[1]
  }

  // See issue #4. api-documenter expects \| to escape table
  // column delimiters, but docusaurus uses a markdown processor
  // that doesn't support this. Replace with an escape sequence
  // that renders |.
  lines = lines.map(line =>
    line.startsWith('|') ? line.replace(/\\\|/g, '&#124;') : line
  )

  lines = [
    '---',
    `title: ${title}`,
    'custom_edit_url:',
    `sidebar_label: ${sidebarLabel}`,
    '---',
    ...lines,
  ]

  await writeFile(file, lines.join('\n'))
}
