import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function NotFound() {
  const [, setLocation] = useLocation();
  
  return (
    <Layout showHeader={true}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-8xl font-black text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-8">Signal lost.</h2>
        <Button size="lg" onClick={() => setLocation('/')}>Return to Base</Button>
      </div>
    </Layout>
  );
}