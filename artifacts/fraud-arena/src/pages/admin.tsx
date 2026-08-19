import React, { useState } from 'react';
import { 
  useGetAdminStats, 
  useGetAdminLeads, 
  useGetDrawPools,
  useRunAdminAction,
  useGetContentAccuracy
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';
import { Download, Users, Gamepad2, Trash2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IconTile } from '@/components/bureau/icon-tile';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';
import { cn } from '@/lib/utils';

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

export default function Admin() {
  const [passcode, setPasscode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length > 3) {
      setAuthenticated(true);
    }
  };

  if (!authenticated) {
    return (
      <Layout showHeader={false}>
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <div className="w-full border border-ink-800 bg-ink-900 p-5">
            <div className="mb-6 flex flex-col gap-4">
              <IconTile icon={ShieldAlert} size={44} />
              <div>
                <h1 className="font-sans text-display-lg font-normal text-white">Host Panel</h1>
                <p className="mt-2 text-body-sm text-[var(--text-on-dark-muted)]">
                  Enter passcode to access operator controls.
                </p>
              </div>
            </div>
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <BureauInput 
                type="password" 
                placeholder="Passcode" 
                value={passcode} 
                onChange={e => setPasscode(e.target.value)}
                className="text-center font-mono text-display-md tracking-widest"
              />
              <Button type="submit" size="lg" chevron className="w-full">
                Access
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return <AdminDashboard passcode={passcode} />;
}

function AdminDashboard({ passcode }: { passcode: string }) {
  const { data: stats, refetch: refetchStats, error: statsError } = useGetAdminStats({ request: { headers: { 'x-admin-passcode': passcode } } });
  const { data: leads, error: leadsError } = useGetAdminLeads({ request: { headers: { 'x-admin-passcode': passcode } } });
  const { data: pools } = useGetDrawPools({ request: { headers: { 'x-admin-passcode': passcode } } });
  
  const actionMutation = useRunAdminAction({ request: { headers: { 'x-admin-passcode': passcode } } });
  const { toast } = useToast();

  const is503 = (statsError as any)?.response?.status === 503 || (leadsError as any)?.response?.status === 503;
  if (is503) {
    return (
      <Layout showHeader={false}>
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <div className="w-full border border-coral-600 bg-ink-900 p-5">
            <div className="mb-6 flex flex-col gap-4">
              <div className="text-coral-600">
                <IconTile icon={ShieldAlert} size={44} />
              </div>
              <div>
                <h1 className="font-sans text-display-lg font-normal text-white">Not Configured</h1>
                <p className="mt-2 text-body-md text-[var(--text-on-dark-muted)]">
                  The host panel is not configured on the server yet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleExportCSV = () => {
    if (!leads) return;
    const header = "Player ID,Name,Email,Phone,Company,Job Function,Consent Date,Games Played,Tier,Total Points\n";
    const rows = leads.map(l => 
      `${l.playerId},"${l.workName}","${l.email}","${l.phone}","${l.company}","${l.jobFunction || ''}",${l.consentAt || ''},${l.gamesPlayed},"${l.tier || ''}",${l.total}`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bureau-leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const handleSeedDemoRows = () => {
    if (confirm("Seed fake entries onto the leaderboard?")) {
      actionMutation.mutate({ data: { action: 'seed_demo_rows' } }, {
        onSuccess: () => {
          toast({ title: "Demo rows seeded" });
          refetchStats();
        }
      });
    }
  };

  const handleClearDemoRows = () => {
    if (confirm("Clear all demo rows from the leaderboard?")) {
      actionMutation.mutate({ data: { action: 'clear_demo_rows' } }, {
        onSuccess: () => {
          toast({ title: "Demo rows cleared" });
          refetchStats();
        }
      });
    }
  };

  return (
    /* The one screen exempt from the no-scroll rule: this is the host's
       operating console, not a player surface, and condensing it would cost
       information the host needs during an event. */
    <Layout title="Host Panel" scrollable>
      <div className="flex w-full flex-col pb-6 pt-4">
        <div className="flex flex-col gap-4">
          <div>
            <EyebrowTag>Operator Panel</EyebrowTag>
            <h1 className="mt-3 font-sans text-display-lg font-normal text-white">Host Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleExportCSV} className="w-full">
            <Download className="mr-2 size-4" strokeWidth={1.5} /> Export CSV ({leads?.length || 0})
          </Button>
        </div>

        {stats?.sixDegreesCautionAcknowledged === false && (
          <div className="mt-5 flex flex-col gap-3 border border-coral-600 bg-ink-900 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-coral-600" strokeWidth={1.5} />
              <div className="flex-1">
                <h3 className="font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-coral-600">
                  Verify Six Degrees Values
                </h3>
                <p className="mt-2 text-body-sm text-[var(--text-on-dark-muted)]">
                  The Four Bacon connections in the Fraud Detective bonus round must be verified against oracleofbacon.org before Day 1 starts.
                </p>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                actionMutation.mutate({ data: { action: 'acknowledge_six_degrees_caution' } }, {
                  onSuccess: () => refetchStats()
                });
              }}
            >
              Acknowledge
            </Button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-px border border-ink-800 bg-ink-800">
          <StatCard icon={Users} label="Players Today" value={stats?.playersToday} />
          <StatCard icon={Users} label="Total Players" value={stats?.playersTotal} />
          <StatCard icon={Gamepad2} label="Runs Today" value={stats?.runsToday} />
          <StatCard icon={Gamepad2} label="Total Runs" value={stats?.runsTotal} />
          <div className="flex flex-col bg-white p-4 text-russian">
            <div className="flex items-center gap-2 text-[var(--text-faint)]">
              <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em]">Source</span>
            </div>
            <div className="mt-auto flex items-end justify-between pt-4">
              <div className="flex flex-col">
                <span className="font-mono text-body-sm text-[var(--text-muted)]">Kiosk</span>
                <span className="font-sans text-card-title font-medium tabular-nums text-violet-700">{stats?.runsByKiosk || 0}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-mono text-body-sm text-[var(--text-muted)]">Phone</span>
                <span className="font-sans text-card-title font-medium tabular-nums text-violet-700">{stats?.runsByPhone || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5">
          {/* Draw Pools */}
          <div className="flex flex-col border border-ice-300 bg-white text-russian">
            <div className="border-b border-ice-300 p-4">
              <h3 className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-russian">Draw Pools</h3>
            </div>
            <div className="flex flex-col">
              <PoolRow label="AirPods Qualifiers (Level 2)" count={pools?.airpods.length} />
              <PoolRow label="iPad MEGA Draw (Level 3)" count={pools?.ipad.length} highlight="coral" />
              <PoolRow label="Fraud Fighters (All 3)" count={pools?.fraudFighter.length} highlight="violet" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col border border-ice-300 bg-white text-russian">
            <div className="border-b border-ice-300 p-4">
              <h3 className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-russian">Controls</h3>
            </div>
            <div className="flex flex-col">
              <ControlRow 
                title="Demo Rows" 
                desc={`${stats?.demoRowCount || 0} rows seeded on leaderboard`}
              >
                <Button variant="dark" size="sm" onClick={handleSeedDemoRows}>Seed</Button>
                <Button variant="destructive" size="sm" onClick={handleClearDemoRows} disabled={!stats?.demoRowCount}>
                  <Trash2 className="mr-2 size-4" strokeWidth={1.5} /> Clear
                </Button>
              </ControlRow>
              
              <ControlRow 
                title="Retained Uploads" 
                desc={`${stats?.uploadsRetained || 0} images in temp storage`}
              >
                <Button variant="dark" size="sm" onClick={() => {
                  const uploadId = prompt("Enter Upload ID to delete:");
                  if (uploadId) {
                    actionMutation.mutate({ data: { action: 'delete_upload', uploadId } }, {
                      onSuccess: () => { toast({ title: "Upload deleted" }); refetchStats(); }
                    });
                  }
                }}>Delete</Button>
              </ControlRow>
              
              <ControlRow 
                title="Goodwill Re-run" 
                desc="Void a specific run to allow a retry"
              >
                <Button variant="dark" size="sm" onClick={() => {
                  const runId = prompt("Enter Run ID to void:");
                  if (runId) {
                    actionMutation.mutate({ data: { action: 'void_run', runId } }, {
                      onSuccess: () => { toast({ title: "Run voided" }); refetchStats(); }
                    });
                  }
                }}>Void Run</Button>
              </ControlRow>
            </div>
          </div>
        </div>
        
        <div className="mt-5">
          <AccuracySection passcode={passcode} />
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value?: number }) {
  return (
    <div className="flex flex-col bg-white p-4 text-russian">
      <div className="flex items-center gap-2 text-[var(--text-faint)]">
        <Icon className="size-4" strokeWidth={1.5} />
        <span className="font-mono text-eyebrow-micro uppercase tracking-[0.03em]">{label}</span>
      </div>
      <div className="mt-auto pt-4 font-sans text-display-lg font-medium tabular-nums text-russian">
        {value || 0}
      </div>
    </div>
  );
}

function PoolRow({ label, count, highlight }: { label: string; count?: number; highlight?: 'coral' | 'violet' }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ice-300 px-4 py-3 last:border-0">
      <span className={cn(
        "font-sans text-body-md",
        highlight === 'coral' ? "text-coral-600 font-medium" : 
        highlight === 'violet' ? "text-violet-700 font-medium" : "text-russian"
      )}>
        {label}
      </span>
      <span className={cn(
        "font-mono text-body-lg font-medium tabular-nums",
        highlight === 'coral' ? "text-coral-600" : 
        highlight === 'violet' ? "text-violet-700" : "text-russian"
      )}>
        {count || 0}
      </span>
    </div>
  );
}

function ControlRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-ice-300 px-4 py-4 last:border-0">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-body-sm font-medium uppercase tracking-[0.03em] text-russian">{title}</span>
        <span className="font-sans text-body-sm text-[var(--text-muted)]">{desc}</span>
      </div>
      <div className="flex shrink-0 gap-2">
        {children}
      </div>
    </div>
  );
}

function AccuracySection({ passcode }: { passcode: string }) {
  const { data: accuracy } = useGetContentAccuracy({ request: { headers: { 'x-admin-passcode': passcode } } });

  if (!accuracy) return null;

  return (
    <div className="flex flex-col border border-ice-300 bg-white text-russian">
      <div className="border-b border-ice-300 p-4">
        <h3 className="font-mono text-eyebrow font-medium uppercase tracking-[0.03em] text-russian">Content Accuracy</h3>
      </div>
      
      <div className="flex flex-col gap-5 p-4">
        <AccuracyGroup title="Spot The Fraud" items={accuracy.questions} />
        <AccuracyGroup title="Fraud Detective" items={accuracy.cases} />
        <AccuracyGroup title="Six Degrees Bonus" items={accuracy.bonusQuestions} />
      </div>
    </div>
  );
}

function AccuracyGroup({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="flex flex-col">
      <h4 className="mb-4 font-mono text-eyebrow-micro font-medium uppercase tracking-[0.03em] text-[var(--text-faint)]">
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-px border border-ice-300 bg-ice-300">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-white p-4">
            <div className="flex flex-col overflow-hidden pr-4">
              {item.id && <span className="mb-1 font-mono text-eyebrow-micro uppercase tracking-[0.03em] text-violet-700">{item.id}</span>}
              <span className="truncate font-sans text-body-sm font-medium text-russian">{item.label}</span>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="font-mono text-body-md font-medium tabular-nums text-russian">
                {Math.round(item.accuracy * 100)}%
              </span>
              <span className="font-mono text-eyebrow-micro tabular-nums text-[var(--text-muted)]">
                {item.correct}/{item.attempts}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
