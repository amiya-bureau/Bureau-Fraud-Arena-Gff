import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-1 flex-col justify-center py-module">
        <EyebrowTag tone="coral">Signal Lost</EyebrowTag>
        <h1 className="mt-6 max-w-[24ch] font-sans text-display-2xl font-normal text-white">
          No route resolves here.
        </h1>
        <p className="mt-6 max-w-[52ch] text-body-lg text-[var(--text-on-dark-muted)]">
          The address does not match anything in the arena.
        </p>
        <div className="mt-stack">
          <Link href="/">
            <Button variant="light" chevron>
              Return to the arena
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
