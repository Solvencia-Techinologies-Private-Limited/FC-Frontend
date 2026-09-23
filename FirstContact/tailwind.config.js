const tailwindConfig = require('@ecp/shared/tailwind.config.js');

module.exports = {
  ...tailwindConfig,
  theme: {
    ...tailwindConfig.theme,
    extend: {
      ...(tailwindConfig.theme?.extend || {}),
      colors: {
        ...(tailwindConfig.theme?.extend?.colors || {}),
        cloud: '#F8FAFD',
        graphite: '#2D353D',
        'primary-cv-blue': '#005CAB',
        'cv-blue': {
          DEFAULT: '#005CAB',
          hover: '#015196',
          light: '#E7F6FF',
          disabled: '#A0C4E2',
          border: '#BDE3FF',
        },
        'cv-gray': {
          50: '#F8FAFD',
          100: '#F4F6F8',
          200: '#DFE3E8',
          300: '#C4CDD5',
          400: '#99A8B5',
          500: '#495662',
          600: '#2D353D',
        },
        'cv-banner': {
          bg: '#E1FBFF',
          border: '#B7ECF3',
        },
      },
      boxShadow: {
        ...(tailwindConfig.theme?.extend?.boxShadow || {}),
        'card': '2px 4px 20px rgba(173, 173, 173, 0.15)',
        'search': '0px 4px 10px rgba(173, 173, 173, 0.15)',
        'button-cv': '2px 4px 10px rgba(173, 173, 173, 0.4)',
      },
      fontFamily: {
        sans: ['"Foundry Sterling"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
      },
    },
  },
  layers: ['utilities'],
  content: [
    "./src/**/*.{html,ts,scss}",
    "./projects/settings/**/*.{html,ts,scss}",
    "./projects/orders/**/*.{html,ts,scss}",
    "./projects/resources/**/*.{html,ts,scss}",
    "./projects/reports/**/*.{html,ts,scss}",
    "./projects/patients/**/*.{html,ts,scss}",
  ],
  purge: {
    enabled: true,
    content: [
      './src/**/*.html',
      './src/**/*.component.ts',
      './src/**/*.component.scss',
      "./projects/settings/**/*.{html,ts,scss}",
      "./projects/orders/**/*.{html,ts,scss}",
      "./projects/resources/**/*.{html,ts,scss}",
      "./projects/reports/**/*.{html,ts,scss}",
      "./projects/patients/**/*.{html,ts,scss}",
      "./projects/shared-lib/**/*.{html,ts,scss}",
      './node_modules/@ecp/shared/esm2015/**/*.component.js',
      './node_modules/@ecp/shared/esm2015/lib/checkbox/checkbox.js',
      './node_modules/ngx-intl-tel-input/esm2015/**/*.component.js',
    ],
    safelist: [
      {
        pattern: /cdk-/,
      },
      {
        pattern: /mat-/,
      },
    ],
    options: {
      safelist: {
        greedy: [/mat-/, /cdk-/],
      },
    },
  },
};
