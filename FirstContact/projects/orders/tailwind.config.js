const path = require('path');
let tailwindConfig = require('../../tailwind.config.js');

// Delete legacy Tailwind v2 purge object so modern 'content' array isn't ignored
if (tailwindConfig.purge) {
  delete tailwindConfig.purge;
}

// Resolve content from this config file so purge does not target emptied legacy ./src
const content = [
  path.join(__dirname, 'src/**/*.{html,ts,scss}'),
  path.join(__dirname, '../shared-lib/**/*.{html,ts,scss}'),
  path.join(__dirname, '../../node_modules/@ecp/shared/fesm2022/ecp-shared.mjs'),
  //path.join(__dirname, '../../node_modules/ngx-intl-tel-input/fesm2020/**/*.mjs'),
];

module.exports = {
  ...tailwindConfig,
  important: true,
  content,
  purge: {
    enabled: true,
    safelist: [
      /cdk-/,
      /mat-/,
      /md:table-row/,
      /md:table-row-group/,
      /md:table-fixed/,
      /md:hidden/,
      /cv-table-row/
    ],
    content,
  },
  plugins: [
    ...(tailwindConfig.plugins || [])
  ]
};
