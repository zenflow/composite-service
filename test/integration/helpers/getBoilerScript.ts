export function getBoilerScript(customCode = '') {
  return `
    const { onceOutputLineIs, onceTcpPortUsed, configureHttpGateway, startCompositeService } = require('.');
    const config = {
      services: {
        api: {
          command: 'node test/integration/fixtures/http-service.js',
          env: { PORT: 8000, RESPONSE_TEXT: 'api' },
          ready: ctx => onceTcpPortUsed(8000),
        },
        web: {
          command: ['node', 'test/integration/fixtures/http-service.js'],
          env: { PORT: 8001, RESPONSE_TEXT: 'web' },
          ready: ctx => onceOutputLineIs(ctx.output, 'Started 🚀\\n'),
        },
        gateway: configureHttpGateway({
          dependencies: ['api', 'web'],
          port: 8080,
          proxies: [
            ['/api', { target: 'http://localhost:8000' }],
            ['/', { target: 'http://localhost:8001' }],
          ],
        }),
      },
    };
    ${customCode};
    startCompositeService(config);
  `
}
