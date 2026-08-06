import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';
import { EyebrowTag } from '@/components/bureau/eyebrow-tag';

export default function NotFound() {
  return (
    <Layout showHeader={false}>
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <EyebrowTag tone="coral">Signal Lost</EyebrowTag>
        <h1 className="mt-4 font-sans text-display-2xl font-normal text-white">
          No route resolves here.
        </h1>
        <p className="mt-3 text-body-md text-[var(--text-on-dark-muted)]">
          The address does not match anything in the arena.
        </p>
      </div>

      <div className="shrink-0 pb-4">
        <Link href="/">
          <Button variant="light" size="lg" chevron className="w-full">
            Return to the arena
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
