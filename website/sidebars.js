const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')

const apiDocFiles = fs
  .readdirSync(path.join(__dirname, '../docs/api'))
  .filter(file => file.endsWith('.md'))

module.exports = {
  docs: [
    'intro',
    {
      Guides: [
        'guides/getting-started',
        'guides/graceful-startup-shutdown',
        'guides/crash-handling',
        'guides/http-gateway',
      ],
      'API Reference': getApiItems(),
    },
    'changelog',
    'roadmap',
  ],
}

function getApiItems() {
  return [
    'api/composite-service',
    {
      Core: [
        getApiNode('startCompositeService'),
        getApiNode('CompositeServiceConfig'),
        getApiNode('ServiceConfig'),
        getApiNode('ReadyContext'),
        getApiNode('OnCrashContext'),
        getApiNode('ServiceCrash'),
      ],
      'Ready Helpers': [
        getApiNode('onceTcpPortUsed'),
        getApiNode('onceTimeout'),
        getApiNode('onceOutputLineIncludes'),
        getApiNode('onceOutputLineIs'),
        getApiNode('onceOutputLine'),
      ],
      'HTTP Gateway': [
        getApiNode('configureHttpGateway'),
        getApiNode('HttpGatewayConfig'),
      ],
    },
  ]
}

function getApiNode(name) {
  const docIds = apiDocFiles
    .filter(file => file.startsWith(`${pkg.name}.${name.toLowerCase()}.`))
    .map(file => `api/${path.parse(file).name}`)
  if (!docIds.length) {
    throw new Error(`Could not find API doc for ${name}`)
  }
  if (docIds.length === 1) {
    return docIds[0]
  }
  const rootDocId = `api/${pkg.name}.${name.toLowerCase()}`
  return {
    type: 'category',
    label: name,
    items: [rootDocId, ...docIds.filter(file => file !== rootDocId)],
  }
}
