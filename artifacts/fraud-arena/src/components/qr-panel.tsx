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
 */
export function QrPanel({ game, className = '', size = 100 }: QrPanelProps) {
  // Build the ?src=qr URL for the current game
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const targetUrl = `${origin}${baseUrl}/${game}?src=qr`;

  return (
    <div className={cn('flex flex-col items-center bg-violet-700 p-6 text-white', className)}>
      <div className="bg-white p-3">
        <QRCodeSVG value={targetUrl} size={size} level="M" />
      </div>
      <p className="mt-4 max-w-[180px] text-center font-mono text-body-sm uppercase leading-tight tracking-[0.03em]">
        Scan to play on your phone
      </p>
      <p className="mt-2 max-w-[180px] text-center text-body-sm opacity-70">
        Your score counts the same.
      </p>
    </div>
  );
}
