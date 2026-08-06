import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useRegisterPlayer,
  useGetPlayerStanding,
  getGetPlayerStandingQueryKey,
  PlayerInput,
  GameKey,
} from '@workspace/api-client-react';
import { usePlayerSession } from '@/lib/store';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';
import { Layout } from '@/components/layout';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { PixelChevron } from '@/components/bureau/pixel-chevron';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  workName: z.string().min(2, "Work name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().transform(val => val.replace(/[\s\-\+]/g, '').replace(/^91/, '')).pipe(
    z.string().length(10, "Must be exactly 10 digits").regex(/^[6-9]\d{9}$/, "Must start with 6-9")
  ),
  company: z.string().min(1, "Company is required"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms" }),
  }),
});

const GAME_LABELS: { key: GameKey; label: string; href: string }[] = [
  { key: 'spot_the_fraud', label: 'Spot the Fraud', href: '/spot-the-fraud' },
  { key: 'spoof_the_system', label: 'Spoof the System', href: '/spoof-the-system' },
  { key: 'fraud_detective', label: 'Fraud Detective', href: '/fraud-detective' },
];

const BureauInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full border border-ink-800 bg-ink-900 px-3 font-sans text-body-md text-white placeholder:text-[var(--text-on-dark-faint)] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] focus:border-violet-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
);
BureauInput.displayName = 'BureauInput';

/**
 * The "You" tab.
 *
 * Two screens behind one destination: registration when there is no session,
 * and the player's own standing once there is. A tab that dead-ends on a form
 * the player already filled in would be a wasted third of the tab bar.
 */
export default function Join() {
  const { session } = usePlayerSession();
  return session ? <PlayerCard /> : <RegistrationForm />;
}

function PlayerCard() {
  const { session, clearSession } = usePlayerSession();
  const [, setLocation] = useLocation();
  const playerId = session?.player.id ?? '';

  const { data: standing } = useGetPlayerStanding(playerId, 'today', {
    query: {
      enabled: !!playerId,
      queryKey: getGetPlayerStandingQueryKey(playerId, 'today'),
    },
  });

  if (!session) return null;

  const played = standing?.scores.filter((s) => s.played).length ?? 0;

  return (
    <Layout title="You" showTabs>
      {/* Identity */}
      <div className="shrink-0 pt-4">
        <EyebrowTag>Registered</EyebrowTag>
        <h1 className="mt-3 font-sans text-display-lg font-normal text-white">
          {session.player.firstName}
        </h1>
        <p className="mt-1 font-mono text-body-sm uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)]">
          {session.player.company}
        </p>
      </div>

      {/* The two numbers that matter, stated bare. */}
      <div className="mt-4 flex shrink-0 gap-px bg-ink-800">
        <div className="flex-1 bg-russian py-3">
          <div className="font-sans text-display-lg font-medium tabular-nums text-white">
            {standing?.total ?? 0}
          </div>
          <div className="mt-1 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
            Points today
          </div>
        </div>
        <div className="flex-1 bg-russian py-3 pl-3">
          <div className="font-sans text-display-lg font-medium tabular-nums text-white">
            {standing?.rank ?? '—'}
          </div>
          <div className="mt-1 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
            Rank
          </div>
        </div>
      </div>

      {/* Per-game progress: each row is also the way back into that game. */}
      <div className="stagger-in mt-4 flex min-h-0 flex-1 flex-col border-t border-ink-800">
        {GAME_LABELS.map(({ key, label, href }) => {
          const score = standing?.scores.find((s) => s.game === key);
          return (
            <button
              key={key}
              onClick={() => setLocation(href)}
              className="tap flex min-h-[44px] flex-1 items-center gap-3 border-b border-ink-800 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-sans text-body-md font-medium text-white">
                  {label}
                </div>
                <div className="mt-0.5 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
                  {score?.played ? `${score.points} of ${score.cap} points` : 'Not played'}
                </div>
              </div>
              <PixelChevron className="shrink-0 text-violet-500" />
            </button>
          );
        })}
      </div>

      <div className="shrink-0 py-3">
        <p className="mb-2 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-faint)]">
          {played} of 3 games played
        </p>
        <Button
          variant="outline"
          size="default"
          onClick={() => {
            clearSession();
            setLocation('/');
          }}
          className="w-full"
        >
          <LogOut className="size-4" strokeWidth={1.5} />
          End session
        </Button>
      </div>
    </Layout>
  );
}

function RegistrationForm() {
  const { saveSession } = usePlayerSession();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegisterPlayer();
  const [noWorkEmail, setNoWorkEmail] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workName: '',
      email: '',
      phone: '',
      company: '',
      consent: undefined as unknown as true,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Basic freemail check
    const freeDomains = ['gmail', 'yahoo', 'outlook', 'hotmail', 'rediffmail', 'proton'];
    const domain = values.email.split('@')[1]?.toLowerCase();

    if (!noWorkEmail && domain && freeDomains.some(d => domain.includes(d))) {
      form.setError('email', { message: "Please use your work email" });
      return;
    }

    const payload: PlayerInput = {
      ...values,
      noWorkEmail
    };

    registerMutation.mutate({ data: payload }, {
      onSuccess: (sessionData) => {
        saveSession(sessionData);
        // Extract return path from query params, or go to home
        const searchParams = new URLSearchParams(window.location.search);
        const returnPath = searchParams.get('return') || '/';

        if (sessionData.returning) {
          toast({
            title: `Welcome back, ${sessionData.player.firstName}`,
            description: "We've attached this run to your existing profile.",
          });
        }

        setLocation(returnPath);
      },
      onError: () => {
        toast({
          title: "Error registering",
          description: "Please check your network and try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout title="Registration" showTabs>
      <div className="shrink-0 pt-4">
        <h1 className="font-sans text-display-lg font-normal text-white">Join the Arena.</h1>
        <p className="mt-1 text-body-sm text-[var(--text-on-dark-muted)]">
          Scores are added to the live leaderboard.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col pt-4"
        >
          <div className="app-scroll flex min-h-0 flex-1 flex-col gap-3">
            <FormField
              control={form.control}
              name="workName"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white">
                    Work Name
                  </FormLabel>
                  <FormControl>
                    <BureauInput placeholder="e.g. Priya Sharma" {...field} />
                  </FormControl>
                  <FormMessage className="font-mono text-body-sm text-coral-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <FormLabel className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white">
                      Work Email
                    </FormLabel>
                    {!noWorkEmail && (
                      <button
                        type="button"
                        onClick={() => setNoWorkEmail(true)}
                        className="tap font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)] underline decoration-1 underline-offset-4"
                      >
                        I don't have one
                      </button>
                    )}
                  </div>
                  <FormControl>
                    <BureauInput type="email" placeholder="priya@company.com" {...field} />
                  </FormControl>
                  <FormMessage className="font-mono text-body-sm text-coral-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white">
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <BureauInput type="tel" inputMode="numeric" placeholder="9XXXXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage className="font-mono text-body-sm text-coral-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-white">
                    Company
                  </FormLabel>
                  <FormControl>
                    <BureauInput placeholder="Your organisation" {...field} />
                  </FormControl>
                  <FormMessage className="font-mono text-body-sm text-coral-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 border border-ink-800 bg-ink-900 p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-none border border-ink-700 bg-russian transition-colors focus-visible:outline-none focus-visible:ring-0 data-[state=checked]:border-violet-700 data-[state=checked]:bg-violet-700 data-[state=checked]:text-white"
                    />
                  </FormControl>
                  <div className="flex min-w-0 flex-col gap-1">
                    <FormLabel className="font-sans text-body-sm leading-snug text-[var(--text-on-dark-muted)]">
                      Bureau may contact me about its products and store these details. Withdraw any
                      time at privacy@bureau.id.
                    </FormLabel>
                    <FormMessage className="font-mono text-body-sm text-coral-600" />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="shrink-0 py-3">
            <Button
              type="submit"
              size="lg"
              chevron
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Registering" : "Join the Arena"}
            </Button>
          </div>
        </form>
      </Form>
    </Layout>
  );
}
