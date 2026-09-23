const rootPostcss = require('../../postcss.config.js');

module.exports = {
  ...rootPostcss,
  plugins: {
    ...rootPostcss.plugins,
    'postcss-prefix-selector': {
      ...rootPostcss.plugins['postcss-prefix-selector'],
      prefix: '#fc-orders-mfe',
    }
  }
};
