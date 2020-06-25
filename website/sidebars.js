const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')

const apiDocFiles = fs
  .readdirSync(path.join(__dirname, '../docs/api'))
  .filter(file => file.endsWith('.md'))

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

module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Introduction',
      items: ['intro/what', 'intro/why'],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/getting-started',
        'guides/basic-usage',
        'guides/graceful-startup-shutdown',
        'guides/http-gateway',
        'guides/errors',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/composite-service',
        {
          Core: [
            getApiNode('startCompositeService'),
            getApiNode('CompositeServiceConfig'),
            getApiNode('ComposedServiceConfig'),
            getApiNode('ReadyConfigContext'),
          ],
          'Ready Helpers': [
            getApiNode('onceOutputLine'),
            getApiNode('onceOutputLineIs'),
            getApiNode('onceOutputLineIncludes'),
            getApiNode('oncePortUsed'),
            getApiNode('onceTimeout'),
          ],
          'HTTP Gateway': [
            getApiNode('configureHttpGateway'),
            getApiNode('HttpGatewayConfig'),
          ],
        },
      ],
    },
  ],
}
