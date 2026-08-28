import { useNavigation } from '@/context/NavigationContext';
import { formatBytes } from '@/lib/format';
import { useGetSpaceQuery } from '@/store/spacesApi';
import { StatCard } from './StatCard';

export function SpaceStats() {
  const { spaceId } = useNavigation();
  const { data: space } = useGetSpaceQuery(spaceId!, { skip: !spaceId });

  const memberCount = space ? space.members.length + 1 : null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        label="Total files"
        value={space ? String(space._count.files) : '—'}
      />
      <StatCard
        label="Storage used"
        value={space ? formatBytes(space.totalSize) : '—'}
      />
      <StatCard
        label="Members"
        value={memberCount !== null ? String(memberCount) : '—'}
      />
    </div>
  );
}
