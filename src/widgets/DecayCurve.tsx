import { useId, useMemo, useState } from 'react';

/**
 * Seed widget. Exists to prove the React island path works end to end, and to
 * serve as the reference for what a widget should look like.
 *
 * Note what it does NOT do: no chart library, no CSS-in-JS, no external state.
 * It reads design tokens through `currentColor` and CSS variables so it tracks
 * light/dark automatically without knowing the theme.
 */

interface Props {
	/** Curve half-life in steps. */
	initialHalfLife?: number;
	steps?: number;
}

const WIDTH = 640;
const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 34 };

export default function DecayCurve({ initialHalfLife = 4, steps = 24 }: Props) {
	const [halfLife, setHalfLife] = useState(initialHalfLife);
	const sliderId = useId();

	const { path, area } = useMemo(() => {
		const plotW = WIDTH - PAD.left - PAD.right;
		const plotH = HEIGHT - PAD.top - PAD.bottom;

		const points = Array.from({ length: steps + 1 }, (_, i) => {
			const value = Math.pow(0.5, i / halfLife);
			return {
				x: PAD.left + (i / steps) * plotW,
				y: PAD.top + (1 - value) * plotH,
			};
		});

		const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
		const baseline = PAD.top + plotH;
		return {
			path: line,
			area: `${line} L${(PAD.left + plotW).toFixed(2)},${baseline} L${PAD.left},${baseline} Z`,
		};
	}, [halfLife, steps]);

	return (
		<figure className="widget">
			<svg
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				role="img"
				aria-label={`Exponential decay curve with a half-life of ${halfLife} steps`}
				preserveAspectRatio="xMidYMid meet"
			>
				{[0, 0.25, 0.5, 0.75, 1].map((t) => {
					const y = PAD.top + t * (HEIGHT - PAD.top - PAD.bottom);
					return (
						<g key={t}>
							<line
								x1={PAD.left}
								x2={WIDTH - PAD.right}
								y1={y}
								y2={y}
								stroke="var(--color-rule)"
								strokeWidth="1"
							/>
							<text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-faint)">
								{(1 - t).toFixed(2)}
							</text>
						</g>
					);
				})}

				<path d={area} fill="var(--color-accent-soft)" />
				<path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />

				<text
					x={WIDTH / 2}
					y={HEIGHT - 6}
					textAnchor="middle"
					fontSize="11"
					fill="var(--color-ink-faint)"
				>
					steps →
				</text>
			</svg>

			<div className="controls">
				<label htmlFor={sliderId}>
					Half-life: <strong>{halfLife}</strong> steps
				</label>
				<input
					id={sliderId}
					type="range"
					min={1}
					max={12}
					step={1}
					value={halfLife}
					onChange={(event) => setHalfLife(Number(event.target.value))}
				/>
			</div>

			<figcaption>Drag to change the half-life.</figcaption>
		</figure>
	);
}
