import React, { useEffect, useState } from 'react';
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
import { useRegisterPlayer, PlayerInput } from '@workspace/api-client-react';
import { usePlayerSession } from '@/lib/store';
import { useLocation, useSearch } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  workName: z.string().min(2, "Work name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().transform(val => {
    const compact = val.trim().replace(/[\s-]/g, '');
    if (compact.startsWith('+91')) return compact.slice(3);
    if (compact.length === 12 && compact.startsWith('91')) return compact.slice(2);
    return compact;
  }).pipe(
    z.string().length(10, "Must be exactly 10 digits").regex(/^[6-9]\d{9}$/, "Must start with 6-9")
  ),
  company: z.string().min(1, "Company is required"),
});

/**
 * The three games, and the only destinations this screen will forward to.
 */
const GAME_PATHS: Record<string, string> = {
  '/spot-the-fraud': 'Spot the Fraud',
  '/spoof-the-system': 'Spoof the System',
  '/fraud-detective': 'Fraud Detective',
};

/** Never forward to whatever the query string asks for — only to a known game. */
function getReturnPath(search: string): string {
  const raw = new URLSearchParams(search).get('return');
  // Own keys only: `in` would accept 'constructor' and friends.
  return raw && Object.hasOwn(GAME_PATHS, raw) ? raw : '/';
}

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
 * Registration.
 *
 * This is not a destination of its own — it is the gate in front of the three
 * games. Tapping a game without a session lands here, and the moment a session
 * exists the player is forwarded into the game they were reaching for, so the
 * form is never something anyone sees twice.
 */
export default function Join() {
  const { session } = usePlayerSession();
  const [, setLocation] = useLocation();
  const returnPath = getReturnPath(useSearch());

  useEffect(() => {
    if (session) setLocation(returnPath, { replace: true });
  }, [session, returnPath, setLocation]);

  if (session) return null;
  return <RegistrationForm gameLabel={GAME_PATHS[returnPath]} />;
}

function RegistrationForm({ gameLabel }: { gameLabel?: string }) {
  const { saveSession } = usePlayerSession();
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
        // Saving the session is what moves the player on: the gate above
        // forwards as soon as one exists.
        saveSession(sessionData);

        if (sessionData.returning) {
          // Store the name so the rules screen can show it inline above
          // "Your Best" instead of as a floating toast that covers the UI.
          window.sessionStorage.setItem('arena_welcome_back', sessionData.player.firstName);
        }
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
    <Layout title="Registration" back="/">
      {/* White hero panel with edge-cluster dots — visual contrast break before the dark form. */}
      <div className="relative -mx-4 mb-0 shrink-0 overflow-hidden bg-white px-4 pb-5 pt-5">
        <div aria-hidden className="bureau-dots-edge pointer-events-none absolute inset-0" />
        {gameLabel ? <EyebrowTag tone="dark">Entering {gameLabel}</EyebrowTag> : null}
        <h1 className="mt-3 font-sans text-display-lg font-normal text-russian">Join the Arena</h1>
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

          </div>

          <p className="shrink-0 font-mono text-eyebrow-micro leading-relaxed tracking-[0.03em] text-[var(--text-on-dark-muted)]">
            By clicking 'Join the Arena', you agree to Bureau's{' '}
            <a
              href="https://bureau.id/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-1 underline-offset-4 hover:text-white"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://bureau.id/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-1 underline-offset-4 hover:text-white"
            >
              Terms &amp; Conditions
            </a>
            .
          </p>

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
