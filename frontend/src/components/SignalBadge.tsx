import type { SwingSignal } from '../types';

interface Props {
  signal: SwingSignal;
}

const signalColors = {
  BUY: 'bg-green-100 text-green-800 border-green-200',
  SELL: 'bg-red-100 text-red-800 border-red-200',
  HOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const strengthLabels = {
  STRONG: '⬆⬆',
  MODERATE: '⬆',
  WEAK: '→',
};

export function SignalBadge({ signal }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${signalColors[signal.type]}`}
    >
      {strengthLabels[signal.strength]} {signal.type}
      <span className="text-xs font-normal opacity-75">{signal.confidence}%</span>
    </span>
  );
}
