const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'orders',
  filename:'remoteEntry.js',
  exposes: {
    './Component': './projects/orders/src/main.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  library: {type:'module'}
});
