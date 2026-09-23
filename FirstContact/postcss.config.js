const postcssPrefixSelector = require('postcss-prefix-selector');

module.exports = (ctx) => ({
  plugins: [
    require('postcss-import')(),
    require('tailwindcss')(),
    require('autoprefixer')(),
    postcssPrefixSelector({
      prefix: ':host',
      exclude: [/^html$/, /^body$/, /^:root$/, /^\.mat-/, /^\.cdk-/, /^\.ng-/, /^ng-/, /^ecp-/],
      transform: function (prefix, selector, prefixedSelector) {
        if (selector.startsWith(':host') || selector.includes('::ng-deep')) {
          return selector;
        }
        return prefix + ' ' + selector;
      }
    })
  ]
});