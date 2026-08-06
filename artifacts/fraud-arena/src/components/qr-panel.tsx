import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface QrPanelProps {
  game: string;
  className?: string;
  size?: number;
}

/**
 * The scan-to-play block. Violet is used here as a solid field — a block, not
 * a gradient wash — with the code sitting on white inside it.
 *
 * Laid out horizontally: on a phone column a stacked QR block eats most of the
 * screen, whereas the code beside its label costs one band.
 */
export function QrPanel({ game, className = '', size = 88 }: QrPanelProps) {
  // Build the ?src=qr URL for the current game
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const targetUrl = `${origin}${baseUrl}/${game}?src=qr`;

  return (
    <div className={cn('flex items-center gap-4 bg-violet-700 p-4 text-white', className)}>
      <div className="shrink-0 bg-white p-2">
        <QRCodeSVG value={targetUrl} size={size} level="M" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-eyebrow-micro uppercase leading-tight tracking-[0.03em]">
          Scan to play on your phone
        </p>
        <p className="mt-1.5 text-body-sm opacity-70">Your score counts the same.</p>
      </div>
    </div>
  );
}
