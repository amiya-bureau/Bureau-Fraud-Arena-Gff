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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useRegisterPlayer, PlayerInput } from '@workspace/api-client-react';
import { usePlayerSession } from '@/lib/store';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';

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

export default function Join() {
  const { saveSession, session } = usePlayerSession();
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
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <ShieldAlert className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Bureau Fraud Arena</h1>
          <p className="text-muted-foreground text-center">
            Register to play. Your score will be added to the live leaderboard.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="workName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Work Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. Priya Sharma" className="h-14 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-baseline">
                    <FormLabel className="text-lg">Work Email</FormLabel>
                    {!noWorkEmail && (
                      <button 
                        type="button" 
                        onClick={() => setNoWorkEmail(true)}
                        className="text-xs text-muted-foreground underline"
                      >
                        I don't have one
                      </button>
                    )}
                  </div>
                  <FormControl>
                    <Input type="email" placeholder="priya@company.com" className="h-14 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" inputMode="numeric" placeholder="9XXXXXXXXX" className="h-14 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Your organisation" className="h-14 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border p-4 bg-background/50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-1 w-6 h-6 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal text-sm leading-relaxed text-muted-foreground">
                      I agree that Bureau may contact me about its products and store the details above. I can withdraw consent any time by writing to privacy@bureau.id.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" className="w-full h-16 text-xl font-bold" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "REGISTERING..." : "JOIN THE ARENA"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
