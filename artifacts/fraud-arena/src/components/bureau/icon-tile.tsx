import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * IconTile — the 60px solid violet square holding a white 28.78px glyph.
 *
 * House rules from the guideline: line icons only, no fills, no colour inside
 * the glyph, 1–1.5px stroke. The odd 28.78px is transcribed from the source.
 */
export function IconTile({
  icon: Icon,
  size = 60,
  tone = 'violet',
  className,
}: {
  icon: LucideIcon;
  size?: number;
  tone?: 'violet' | 'white' | 'ink';
  className?: string;
}) {
  const glyph = size * (28.78 / 60);

  const tones = {
    violet: 'bg-violet-700 text-white',
    white: 'bg-white text-russian',
    ink: 'bg-ink-800 text-white',
  } as const;

  return (
    <div
      className={cn('flex shrink-0 items-center justify-center', tones[tone], className)}
      style={{ width: size, height: size }}
    >
      <Icon style={{ width: glyph, height: glyph }} strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}
