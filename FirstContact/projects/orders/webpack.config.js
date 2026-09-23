const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  experiments: {
    outputModule: true,
  },
  output: {
    publicPath: 'auto',
    uniqueName: 'reports',
    library: {
      type: 'module',
    },
  },
  optimization: {
    runtimeChunk: false,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'orders',
      filename: 'remoteEntry.js',
      library: { type: 'module' },
      exposes: {
        './OrdersModule': './projects/orders/src/main.mfe.ts',
      },
      shared: {
        // Explicitly empty to avoid version conflicts with the host
      },
    }),
  ],
};
