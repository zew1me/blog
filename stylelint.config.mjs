export default {
	extends: ['stylelint-config-standard'],
	overrides: [
		{
			files: ['**/*.astro'],
			customSyntax: 'postcss-html',
		},
	],
	rules: {
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: ['custom-variant', 'plugin', 'source', 'theme', 'utility', 'variant'],
			},
		],
		'custom-property-pattern': null,
		'no-descending-specificity': null,
		'property-no-vendor-prefix': null,
		'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
	},
};
