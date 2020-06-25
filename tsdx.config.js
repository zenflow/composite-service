module.exports = {
  rollup(config, options) {
    // options.env can be 'development' or 'production'
    if (options.env === 'production') {
      // redirect prod build to nowhere
      config.output.file = `${__dirname}/temp/tsdx-prod-build/file.js`
    } else {
      // config.input can be 'src/index.js' 'src/http-gateway/server.ts' **as per package build scripts**
      if (config.input.endsWith('/http-gateway/server.ts')) {
        config.output.file = `${__dirname}/dist/http-gateway-server.js`
      } else {
        // overwrite tsdx default entry file
        config.output.file = `${__dirname}/dist/index.js`
      }
    }
    return config
  },
}
