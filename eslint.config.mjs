import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import importX from 'eslint-plugin-import-x';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

const typedFiles = ['src/**/*.{ts,tsx}'];
const codeFiles = ['src/**/*.{ts,tsx,astro}', 'astro.config.mjs'];

export default tseslint.config(
	{
		ignores: ['.astro/**', 'dist/**', 'node_modules/**'],
	},
	eslint.configs.recommended,
	...astro.configs['flat/recommended'],
	...astro.configs['flat/jsx-a11y-recommended'],
	...tseslint.configs.strictTypeChecked.map((config) => ({ ...config, files: typedFiles })),
	...tseslint.configs.stylisticTypeChecked.map((config) => ({ ...config, files: typedFiles })),
	{
		files: typedFiles,
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: codeFiles,
		plugins: {
			'import-x': importX,
			security,
			sonarjs,
			unicorn,
		},
		rules: {
			'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
			'import-x/no-duplicates': 'error',
			'security/detect-buffer-noassert': 'error',
			'security/detect-child-process': 'error',
			'security/detect-disable-mustache-escape': 'error',
			'security/detect-eval-with-expression': 'error',
			'security/detect-new-buffer': 'error',
			'security/detect-no-csrf-before-method-override': 'error',
			'security/detect-non-literal-regexp': 'error',
			'security/detect-pseudoRandomBytes': 'error',
			'sonarjs/cognitive-complexity': ['error', 15],
			'sonarjs/no-duplicated-branches': 'error',
			'sonarjs/no-identical-conditions': 'error',
			'sonarjs/no-identical-expressions': 'error',
			'unicorn/consistent-function-scoping': 'error',
			'unicorn/no-abusive-eslint-disable': 'error',
			'unicorn/prefer-node-protocol': 'error',
		},
	},
	{
		files: typedFiles,
		rules: {
			'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
			'@typescript-eslint/no-confusing-void-expression': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
			'@typescript-eslint/switch-exhaustiveness-check': 'error',
		},
	},
	prettier,
);
