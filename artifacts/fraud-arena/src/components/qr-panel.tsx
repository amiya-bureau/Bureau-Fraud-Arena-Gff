import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface QrPanelProps {
  /** A game path to open directly. Omit to point at the arena's front door. */
  game?: string;
  /** Overrides the second line. */
  note?: string;
  /** Violet is the in-game treatment; light is for screens already carrying colour. */
  tone?: 'violet' | 'light';
  className?: string;
  size?: number;
}

/**
 * The scan-to-play block. A solid field with the code sitting on white inside
 * it — a block, never a gradient wash.
 *
 * Laid out horizontally: on a phone column a stacked QR block eats most of the
 * screen, whereas the code beside its label costs one band.
 */
export function QrPanel({
  game,
  note = 'Your score counts the same.',
  tone = 'violet',
  className = '',
  size = 88,
}: QrPanelProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const targetUrl = `${origin}${baseUrl}/${game ? `${game}?src=qr` : '?src=qr'}`;

  const light = tone === 'light';

  return (
    <div
      className={cn(
        'relative flex items-center gap-4 overflow-hidden p-4',
        light ? 'bg-white text-russian' : 'bg-violet-700 text-white',
        className,
      )}
    >
      {/* Corner-cluster dots on the light variant; white dots on violet. */}
      {light
        ? <div aria-hidden className="bureau-dots-edge pointer-events-none absolute inset-0" />
        : <div aria-hidden className="bureau-dots-white pointer-events-none absolute inset-0" />
      }
      <div className="shrink-0 bg-white p-2">
        <QRCodeSVG value={targetUrl} size={size} level="M" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-eyebrow-micro uppercase leading-tight tracking-[0.03em]">
          Scan to play on your phone
        </p>
        <p className={cn('mt-1.5 text-body-sm', light ? 'text-[var(--text-muted)]' : 'opacity-70')}>
          {note}
        </p>
      </div>
    </div>
  );
}
