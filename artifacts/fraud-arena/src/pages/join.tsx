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
import { useRegisterPlayer, PlayerInput } from '@workspace/api-client-react';
import { usePlayerSession } from '@/lib/store';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout';
import { IconTile } from '@/components/bureau/icon-tile';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
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

const BureauInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-14 w-full border border-ink-800 bg-ink-900 px-4 py-3 font-sans text-body-lg text-white placeholder:text-[var(--text-on-dark-faint)] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:border-violet-700 focus:border-violet-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
);
BureauInput.displayName = 'BureauInput';

export default function Join() {
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
    <Layout showHeader={false}>
      <div className="mx-auto flex w-full max-w-[640px] flex-col py-12 md:py-24">
        <IconTile icon={ShieldAlert} size={60} />
        
        <div className="mt-8">
          <EyebrowTag>Registration</EyebrowTag>
          <h1 className="mt-4 font-sans text-display-xl font-normal text-white">Join the Arena.</h1>
          <p className="mt-4 text-body-lede text-[var(--text-on-dark-muted)]">
            Register to play. Scores are added to the live leaderboard.
          </p>
        </div>

        <div className="mt-stack border-t border-ink-800 pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="workName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-white">
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
                  <FormItem className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <FormLabel className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-white">
                        Work Email
                      </FormLabel>
                      {!noWorkEmail && (
                        <button 
                          type="button" 
                          onClick={() => setNoWorkEmail(true)}
                          className="font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-[var(--text-on-dark-muted)] underline decoration-1 underline-offset-4 transition-colors hover:text-white"
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
                  <FormItem className="space-y-2">
                    <FormLabel className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-white">
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
                  <FormItem className="space-y-2">
                    <FormLabel className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-white">
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
                  <FormItem className="mt-4 flex flex-row items-start gap-4 space-y-0 border border-ink-800 bg-ink-900 p-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-none border border-ink-700 bg-russian transition-colors focus-visible:outline-none focus-visible:ring-0 data-[state=checked]:border-violet-700 data-[state=checked]:bg-violet-700 data-[state=checked]:text-white"
                      />
                    </FormControl>
                    <div className="flex flex-col gap-2">
                      <FormLabel className="font-sans text-body-md leading-relaxed text-[var(--text-on-dark-muted)]">
                        I agree that Bureau may contact me about its products and store the details above. I can withdraw consent any time by writing to privacy@bureau.id.
                      </FormLabel>
                      <FormMessage className="font-mono text-body-sm text-coral-600" />
                    </div>
                  </FormItem>
                )}
              />

              <div className="mt-4">
                <Button type="submit" size="lg" chevron className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Registering" : "Join the Arena"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
