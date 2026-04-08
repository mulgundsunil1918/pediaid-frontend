// =============================================================================
// browse/SkeletonCard.tsx — animated loading placeholders
// =============================================================================

interface SkeletonCardProps {
  variant: 'subject' | 'chapter' | 'topic';
}

// Reusable shimmer line
function SkimLine({
  width = 'w-full',
  height = 'h-3',
  className = '',
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={['bg-gray-200 rounded-full', width, height, className].join(
        ' ',
      )}
    />
  );
}

function SubjectSkeleton() {
  return (
    <div className="acad-card p-6 animate-pulse">
      {/* Code badge */}
      <div className="mb-3">
        <SkimLine width="w-12" height="h-5" className="rounded-full" />
      </div>
      {/* Title */}
      <SkimLine width="w-3/4" height="h-5" className="mb-2" />
      {/* Description lines */}
      <SkimLine width="w-full" height="h-3" className="mb-1.5" />
      <SkimLine width="w-5/6" height="h-3" className="mb-4" />
      {/* System count */}
      <SkimLine width="w-24" height="h-3" />
    </div>
  );
}

function ChapterSkeleton() {
  return (
    <div className="acad-card p-5 animate-pulse">
      {/* Title */}
      <SkimLine width="w-full" height="h-5" className="mb-1.5" />
      <SkimLine width="w-4/5" height="h-5" className="mb-4" />
      {/* Author row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <SkimLine width="w-40" height="h-3" />
          <SkimLine width="w-32" height="h-3" />
        </div>
      </div>
      {/* Meta row */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-border">
        <SkimLine width="w-20" height="h-3" />
        <SkimLine width="w-24" height="h-3" />
      </div>
    </div>
  );
}

function TopicSkeleton() {
  return (
    <div className="acad-card p-5 animate-pulse">
      <SkimLine width="w-2/3" height="h-4" className="mb-2" />
      <SkimLine width="w-28" height="h-3" />
    </div>
  );
}

export function SkeletonCard({ variant }: SkeletonCardProps) {
  switch (variant) {
    case 'subject':
      return <SubjectSkeleton />;
    case 'chapter':
      return <ChapterSkeleton />;
    case 'topic':
      return <TopicSkeleton />;
  }
}

/** Renders n skeleton cards of the given variant in a fragment */
export function SkeletonGrid({
  variant,
  count,
}: {
  variant: SkeletonCardProps['variant'];
  count: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </>
  );
}
