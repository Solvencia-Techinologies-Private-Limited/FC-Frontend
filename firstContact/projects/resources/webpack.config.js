const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'resources',
  filename:'remoteEntry.js',
  exposes: {
    './Component': './projects/resources/src/main.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  library: {type:'module'}
});
