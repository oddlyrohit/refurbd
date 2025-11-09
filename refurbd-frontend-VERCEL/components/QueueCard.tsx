// /components/QueueCard.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/ui/Card';
import Progress from '@/components/ui/Progress';
import { listJobs, type Job } from '@/lib/api';

type Props = {
  projectId?: string;
};

export default function QueueCard({ projectId }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    (async () => {
      try {
        const data = await listJobs(projectId);
        if (mounted.current) setJobs(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (mounted.current) setError(e?.message || 'Failed to load queue');
      }
    })();

    return () => {
      mounted.current = false;
    };
  }, [projectId]);

  const visible = useMemo(() => {
    const now = Date.now();
    // Keep items that are not completed, or recently updated (< 90s)
    const fresh = jobs.filter(
      (j) => j.status !== 'completed' || (j.updated_at && now - Date.parse(j.updated_at) < 90_000)
    );
    return (fresh.length ? fresh : jobs).slice(0, 5);
  }, [jobs]);

  return (
    <Card title="Render Queue" description="Latest jobs and live progress">
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

      <div className="space-y-3">
        {visible.map((j) => (
          <div key={j.id} className="flex items-center justify-between">
            <div className="text-sm">{j.name ?? j.id}</div>
            <div className="w-36">
              <Progress
                value={
                  typeof j.progress === 'number'
                    ? j.progress
                    : j.status === 'completed'
                    ? 100
                    : j.status === 'failed'
                    ? 0
                    : 10
                }
              />
            </div>
          </div>
        ))}

        {!visible.length && <div className="text-sm text-slate-500">No recent jobs.</div>}
      </div>
    </Card>
  );
}
