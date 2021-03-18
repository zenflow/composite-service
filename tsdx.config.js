module.exports = {
  rollup(config, options) {
    // options.env can be 'development' or 'production'
    if (options.env === "production") {
      // redirect prod build to nowhere
      config.output.file = `${__dirname}/temp/tsdx-prod-build/file.js`;
    } else {
      // overwrite tsdx default entry file
      config.output.file = `${__dirname}/dist/index.js`;
    }
    return config;
  },
};
