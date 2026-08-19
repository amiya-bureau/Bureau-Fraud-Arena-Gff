import { useLocation } from 'wouter';
import { Fingerprint, LogOut, ScanEye, Target, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type GameKey = 'spot_the_fraud' | 'spoof_the_system' | 'fraud_detective';

interface OtherGame {
  key: GameKey;
  label: string;
  href: string;
  icon: LucideIcon;
}

const OTHER_GAMES: OtherGame[] = [
  {
    key: 'spot_the_fraud',
    label: 'Try Spot the Fraud',
    href: '/spot-the-fraud',
    icon: Target,
  },
  {
    key: 'spoof_the_system',
    label: 'Try Spoof the System',
    href: '/spoof-the-system',
    icon: ScanEye,
  },
  {
    key: 'fraud_detective',
    label: 'Try Fraud Detective',
    href: '/fraud-detective',
    icon: Fingerprint,
  },
];

interface RetryOptionsProps {
  currentGame: GameKey;
  onRetry: () => void;
}

/**
 * Consistent failure-screen action stack. Keeping this as one component makes
 * Retry, the two cross-game routes, and End Run line up identically anywhere
 * a game explains a failed attempt.
 */
export function RetryOptions({ currentGame, onRetry }: RetryOptionsProps) {
  const [, setLocation] = useLocation();
  const otherGames = OTHER_GAMES.filter((game) => game.key !== currentGame);

  return (
    <div className="flex shrink-0 flex-col gap-2.5">
      <Button
        variant="light"
        size="lg"
        chevron
        onClick={onRetry}
        className="min-h-[64px] w-full"
      >
        Retry
      </Button>

      {otherGames.map((game) => {
        const Icon = game.icon;

        return (
          <Button
            key={game.key}
            variant="outline"
            size="lg"
            onClick={() => setLocation(game.href)}
            className="min-h-[64px] w-full justify-start gap-3"
          >
            <Icon className="size-4 shrink-0 text-violet-400" />
            {game.label}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="lg"
        onClick={() => setLocation('/')}
        className="min-h-[64px] w-full justify-start gap-3"
      >
        <LogOut className="size-4 shrink-0 text-violet-400" />
        End Run
      </Button>
    </div>
  );
}