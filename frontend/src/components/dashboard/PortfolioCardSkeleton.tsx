'use client'

import { Card } from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

/** Placeholder matching PortfolioCard's layout, shown while holdings load. */
export default function PortfolioCardSkeleton() {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Skeleton width={90} height={22} />
          <Skeleton width={70} height={12} style={{ marginTop: 8 }} />
        </div>
        <div>
          <Skeleton width={110} height={20} />
          <Skeleton width={60} height={12} style={{ marginTop: 8, marginLeft: 'auto' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} variant="sunken" padding="10px 12px">
            <Skeleton width={64} height={10} />
            <Skeleton width={90} height={16} style={{ marginTop: 8 }} />
          </Card>
        ))}
      </div>
      <Skeleton height={34} radius={8} />
    </Card>
  )
}
