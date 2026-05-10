import { useOutletContext } from 'react-router-dom';
import LinkedPlatformsPanel from '@/components/linked/LinkedPlatformsPanel';

export default function B99Linked() {
  const { identity }: any = useOutletContext();
  return <LinkedPlatformsPanel userId={identity?.userId} />;
}
