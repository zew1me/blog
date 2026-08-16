import console from 'node:console';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';

const cssPath = new URL('../src/styles/global.css', import.meta.url);
const css = await readFile(cssPath, 'utf8');
const minimumTextContrast = 4.5;

const themes = {
	light: parsePalette(extractBlock(css, '@theme')),
	dark: parsePalette(extractBlock(css, "[data-theme='dark']")),
};

const textPairs = [
	['ink on paper', 'ink', 'paper'],
	['muted ink on paper', 'ink-muted', 'paper'],
	['faint ink on paper', 'ink-faint', 'paper'],
	['accent on paper', 'accent', 'paper'],
	['warning on paper', 'warn', 'paper'],
	['tip on paper', 'tip', 'paper'],
	['ink on recessed surfaces', 'ink', 'paper-sunk'],
	['muted ink on recessed surfaces', 'ink-muted', 'paper-sunk'],
	['faint ink on recessed surfaces', 'ink-faint', 'paper-sunk'],
	['accent on recessed surfaces', 'accent', 'paper-sunk'],
	['ink on accent fills', 'ink', 'accent-soft'],
	['accent on accent fills', 'accent', 'accent-soft'],
	['ink on warning fills', 'ink', 'warn-soft'],
	['warning on warning fills', 'warn', 'warn-soft'],
	['ink on tip fills', 'ink', 'tip-soft'],
	['tip on tip fills', 'tip', 'tip-soft'],
];

const failures = [];

for (const [themeName, palette] of Object.entries(themes)) {
	for (const [label, foreground, background] of textPairs) {
		const ratio = contrast(palette[foreground], palette[background]);
		if (ratio < minimumTextContrast) {
			failures.push(
				`${themeName}: ${label} is ${ratio.toFixed(2)}:1 (minimum ${minimumTextContrast}:1)`,
			);
		}
	}
}

// Tailwind Typography emits its default .prose palette in the utilities layer.
// The doubled selector must remain more specific or those light defaults win in dark mode.
const proseOverrides = extractBlock(css, '.prose.prose');
for (const token of [
	'body',
	'headings',
	'lead',
	'links',
	'bold',
	'counters',
	'bullets',
	'quotes',
	'captions',
	'code',
]) {
	if (!proseOverrides.includes(`--tw-prose-${token}:`)) {
		failures.push(`prose contrast override is missing --tw-prose-${token}`);
	}
}

if (failures.length > 0) {
	console.error('WCAG contrast check failed:\n');
	for (const failure of failures) console.error(`  - ${failure}`);
	process.exitCode = 1;
} else {
	console.log(
		`WCAG contrast check passed (${textPairs.length * Object.keys(themes).length} theme pairs at 4.5:1 or better).`,
	);
}

function extractBlock(source, selector) {
	const selectorIndex = source.indexOf(selector);
	if (selectorIndex === -1) throw new Error(`Missing CSS block: ${selector}`);

	const start = source.indexOf('{', selectorIndex);
	let depth = 0;
	for (let index = start; index < source.length; index += 1) {
		if (source[index] === '{') depth += 1;
		if (source[index] === '}') depth -= 1;
		if (depth === 0) return source.slice(start + 1, index);
	}

	throw new Error(`Unclosed CSS block: ${selector}`);
}

function parsePalette(block) {
	const palette = {};
	const declaration = /--color-([\w-]+):\s*oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)deg\s*\)/g;

	for (const match of block.matchAll(declaration)) {
		palette[match[1]] = [Number(match[2]) / 100, Number(match[3]), Number(match[4])];
	}

	return palette;
}

function contrast(foreground, background) {
	if (!foreground || !background)
		throw new Error('Contrast pair references a missing colour token');
	const foregroundLuminance = relativeLuminance(foreground);
	const backgroundLuminance = relativeLuminance(background);
	const lighter = Math.max(foregroundLuminance, backgroundLuminance);
	const darker = Math.min(foregroundLuminance, backgroundLuminance);
	return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance([lightness, chroma, hue]) {
	const radians = (hue * Math.PI) / 180;
	const a = chroma * Math.cos(radians);
	const b = chroma * Math.sin(radians);
	const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
	const [red, green, blue] = [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	].map((channel) => Math.min(1, Math.max(0, channel)));

	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
