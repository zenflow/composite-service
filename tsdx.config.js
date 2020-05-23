module.exports = {
  rollup(config, options) {
    // options.env can be 'development' or 'production'
    if (options.env === 'production') {
      // redirect prod build to nowhere
      config.output.file = `${__dirname}/temp/tsdx-prod-build/file.js`
    } else {
      // config.input can be 'src/index.js' 'src/http-proxy/server.ts' **as per package build scripts**
      if (config.input.endsWith('/http-proxy/server.ts')) {
        config.output.file = `${__dirname}/dist/http-proxy-server.js`
      } else {
        // overwrite tsdx default entry file
        config.output.file = `${__dirname}/dist/index.js`
      }
    }
    return config
  },
}
