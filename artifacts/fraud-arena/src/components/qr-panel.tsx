import { QRCodeSVG } from 'qrcode.react';

interface QrPanelProps {
  game: string;
  className?: string;
  size?: number;
}

export function QrPanel({ game, className = '', size = 100 }: QrPanelProps) {
  // Build the ?src=qr URL for the current game
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const targetUrl = `${origin}${baseUrl}/${game}?src=qr`;

  return (
    <div className={`flex flex-col items-center bg-card text-card-foreground p-4 rounded-xl border border-border shadow-lg ${className}`}>
      <div className="bg-white p-2 rounded-lg mb-3">
        <QRCodeSVG value={targetUrl} size={size} level="M" />
      </div>
      <p className="text-xs text-center font-mono text-muted-foreground leading-tight max-w-[150px]">
        Scan to play on your phone - your score counts the same
      </p>
    </div>
  );
}
