const { execSync } = require('child_process')
const { parse, join } = require('path')
const { readdir, readFile, writeFile, unlink } = require('fs').promises
const pkg = require('../package.json')

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
    }),
  )
}

async function processMdFile(file) {
  let lines = (await readFile(file, 'utf8')).split(/\r?\n/)

  // Unescape escaped markdown links
  const escapedMarkdownLinkPattern = /\\\[([^[\]]+)\\]\(([^()]+)\)/
  lines = lines.map(line => {
    let result = line
    while (escapedMarkdownLinkPattern.test(result)) {
      result = result.replace(
        escapedMarkdownLinkPattern,
        (_, link, title) => `[${link}](${title})`,
      )
    }
    return result
  })

  // See issue #4. api-documenter expects \| to escape table
  // column delimiters, but docusaurus uses a markdown processor
  // that doesn't support this. Replace with an escape sequence
  // that renders |.
  lines = lines.map(line =>
    line.startsWith('|') ? line.replace(/\\\|/g, '&#124;') : line,
  )

  // Convert some section headings to actual headings
  for (const section of ['Signature', 'Returns']) {
    lines = lines.map(line =>
      line === `<b>${section}:</b>` ? `## ${section}` : line,
    )
  }

  // Extract `title` and delimit "Summary" section
  const titleLinePattern = /## (.*)/
  const titleLineIndex = lines.findIndex(line => titleLinePattern.test(line))
  const title = lines[titleLineIndex].match(titleLinePattern)[1]
  lines[titleLineIndex] = `## Summary`

  // --- `lines` defined, now extract remaining data from it

  const breadcrumbsPattern = /\[Home\]\(.\/index\.md\) &gt; (.*)/
  const breadcrumbsIndex = lines.findIndex(line =>
    breadcrumbsPattern.test(line),
  )
  const breadcrumbs = lines[breadcrumbsIndex].match(breadcrumbsPattern)[1]

  const {
    Functions = [],
    Interfaces = [],
    Summary = [],
    Signature = [],
    Remarks = [],
    Properties = [],
    Parameters = [],
    Returns = [],
    Example = [],
    ...rest
  } = parseSections(lines)
  if (Object.keys(rest).length) {
    throw new Error(`Unhandled sections: ${Object.keys(rest).join(', ')}`)
  }

  const [exportName, exportType] = title.split(' ')

  let sidebarLabel
  const exportNameParts = exportName.split('.')
  if (exportType === 'interface') {
    sidebarLabel = 'interface'
  } else if (exportNameParts.length === 1) {
    sidebarLabel = title
  } else {
    sidebarLabel = `${exportNameParts.slice(1).join('.')} ${exportType}`
  }

  let output = [
    '---',
    `title: ${title}`,
    `sidebar_label: ${sidebarLabel}`,
    'hide_title: true',
    'custom_edit_url:',
    '---',
    '',
    parse(file).name !== pkg.name ? breadcrumbs : '',
    '',
    `# ${title}`,
    '',
    ...Functions, // for package doc
    ...Interfaces, // for package doc
    ...Summary,
    ...(exportType === 'property' ? Signature : []),
    ...Remarks,
    ...Properties,
    ...Parameters,
    ...Returns,
    ...Example,
  ]

  // Prefix all heading lines with another '#'
  output = output.map(line => (line[0] === '#' ? `#${line}` : line))

  await writeFile(file, output.join('\n'))
}

function parseSections(lines) {
  const result = {}
  let currentSection
  for (const line of lines) {
    const match = line.match(/## (.*)/)
    if (match) {
      currentSection = match[1]
      result[currentSection] = []
    }
    if (currentSection) {
      result[currentSection].push(line)
    }
  }
  for (const key of Object.keys(result)) {
    if (result[key].filter(Boolean).length === 1) {
      delete result[key]
    }
  }
  return result
}
