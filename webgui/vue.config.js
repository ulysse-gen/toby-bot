const { defineConfig } = require("@vue/cli-service");
const webpack = require("webpack");

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        https: require.resolve("https-browserify"),
        zlib: require.resolve("browserify-zlib"),
        stream: require.resolve("stream-browserify"),
        http: require.resolve("stream-http"),
      },
    },
  },
});
