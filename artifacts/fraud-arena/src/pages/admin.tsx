import { useState } from 'react';
import { 
  useGetAdminStats, 
  useGetAdminLeads, 
  useGetDrawPools,
  useRunAdminAction,
  useGetContentAccuracy
} from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/layout';
import { Download, Users, Gamepad2, Trash2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Admin() {
  const [passcode, setPasscode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const { toast } = useToast();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length > 3) {
      setAuthenticated(true);
    }
  };

  if (!authenticated) {
    return (
      <Layout showHeader={false}>
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 w-full max-w-sm text-center">
            <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-6">Host Panel</h1>
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <Input 
                type="password" 
                placeholder="Passcode" 
                value={passcode} 
                onChange={e => setPasscode(e.target.value)}
                className="text-center text-xl tracking-widest h-14"
              />
              <Button type="submit" size="lg" className="w-full">Access</Button>
            </form>
          </Card>
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
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 w-full max-w-sm text-center">
            <ShieldAlert className="w-12 h-12 text-warning mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Not Configured</h1>
            <p className="text-muted-foreground">The host panel isn't configured on the server yet.</p>
          </Card>
        </div>
      </Layout>
    );
  }

  const handleExportCSV = () => {
    if (!leads) return;
    const header = "Player ID,Name,Email,Phone,Company,Consent Date,Games Played,Tier,Total Points\n";
    const rows = leads.map(l => 
      `${l.playerId},"${l.workName}","${l.email}","${l.phone}","${l.company}",${l.consentAt || ''},${l.gamesPlayed},"${l.tier || ''}",${l.total}`
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
    <Layout showHeader={true}>
      <div className="w-full max-w-5xl mx-auto py-8 flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Host Dashboard</h1>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV ({leads?.length || 0})
          </Button>
        </div>

        {stats?.sixDegreesCautionAcknowledged === false && (
          <div className="p-4 bg-warning/20 border border-warning rounded-xl flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-warning shrink-0" />
            <div>
              <h3 className="font-bold text-warning mb-1">Verify Six Degrees Values</h3>
              <p className="text-sm text-warning-foreground mb-3">
                The Four Bacon connections in the Fraud Detective bonus round must be verified against oracleofbacon.org before Day 1 starts.
              </p>
              <Button size="sm" variant="outline" className="border-warning text-warning hover:bg-warning/10" onClick={() => {
                actionMutation.mutate({ data: { action: 'acknowledge_six_degrees_caution' } }, {
                  onSuccess: () => refetchStats()
                })
              }}>
                Acknowledged
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Players Today" value={stats?.playersToday} />
          <StatCard icon={Users} label="Total Players" value={stats?.playersTotal} />
          <StatCard icon={Gamepad2} label="Runs Today" value={stats?.runsToday} />
          <StatCard icon={Gamepad2} label="Total Runs" value={stats?.runsTotal} />
          <Card className="p-6 flex flex-col gap-2">
            <span className="font-medium text-muted-foreground text-sm">Source</span>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm">Kiosk: <strong className="text-primary font-mono">{stats?.runsByKiosk || 0}</strong></span>
              <span className="text-sm">Phone: <strong className="text-primary font-mono">{stats?.runsByPhone || 0}</strong></span>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Draw Pools</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <span className="font-medium">AirPods Qualifiers (Level 2)</span>
                <span className="font-mono font-bold text-lg">{pools?.airpods.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <span className="font-medium text-accent">iPad MEGA Draw (Level 3)</span>
                <span className="font-mono font-bold text-lg text-accent">{pools?.ipad.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <span className="font-medium text-primary">Fraud Fighters (All 3)</span>
                <span className="font-mono font-bold text-lg text-primary">{pools?.fraudFighter.length || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Controls</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h4 className="font-bold">Demo Rows</h4>
                  <p className="text-sm text-muted-foreground">{stats?.demoRowCount || 0} rows seeded on leaderboard</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSeedDemoRows}>
                    Seed
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleClearDemoRows} disabled={!stats?.demoRowCount}>
                    <Trash2 className="w-4 h-4 mr-2" /> Clear
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h4 className="font-bold">Retained Uploads</h4>
                  <p className="text-sm text-muted-foreground">{stats?.uploadsRetained || 0} images in temp storage</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  const uploadId = prompt("Enter Upload ID to delete:");
                  if (uploadId) {
                    actionMutation.mutate({ data: { action: 'delete_upload', uploadId } }, {
                      onSuccess: () => { toast({ title: "Upload deleted" }); refetchStats(); }
                    });
                  }
                }}>
                  Delete Upload
                </Button>
              </div>

              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h4 className="font-bold">Goodwill Re-run</h4>
                  <p className="text-sm text-muted-foreground">Void a specific run to allow a retry</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  const runId = prompt("Enter Run ID to void:");
                  if (runId) {
                    actionMutation.mutate({ data: { action: 'void_run', runId } }, {
                      onSuccess: () => { toast({ title: "Run voided" }); refetchStats(); }
                    });
                  }
                }}>
                  Void Run
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        <AccuracySection passcode={passcode} />
      </div>
    </Layout>
  );
}

function AccuracySection({ passcode }: { passcode: string }) {
  const { data: accuracy } = useGetContentAccuracy({ request: { headers: { 'x-admin-passcode': passcode } } });

  if (!accuracy) return null;

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Content Accuracy</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-muted-foreground uppercase text-xs tracking-widest mb-3">Spot The Fraud</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accuracy.questions.map(q => (
              <div key={q.id} className="p-3 border border-border bg-background rounded-lg flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <div className="font-mono text-xs text-primary mb-1">{q.id}</div>
                  <div className="text-sm font-medium truncate">{q.label}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold">{Math.round(q.accuracy * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">{q.correct}/{q.attempts}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-muted-foreground uppercase text-xs tracking-widest mb-3">Fraud Detective</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accuracy.cases.map(c => (
              <div key={c.id} className="p-3 border border-border bg-background rounded-lg flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <div className="font-mono text-xs text-primary mb-1">{c.id}</div>
                  <div className="text-sm font-medium truncate">{c.label}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold">{Math.round(c.accuracy * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">{c.correct}/{c.attempts}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-muted-foreground uppercase text-xs tracking-widest mb-3">Six Degrees Bonus</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accuracy.bonusQuestions.map(b => (
              <div key={b.id} className="p-3 border border-border bg-background rounded-lg flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <div className="text-sm font-medium truncate">{b.label}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold">{Math.round(b.accuracy * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">{b.correct}/{b.attempts}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-6 flex flex-col gap-2">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-4xl font-black font-mono text-primary">{value || 0}</div>
    </Card>
  );
}