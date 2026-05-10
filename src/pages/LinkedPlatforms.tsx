import Layout from '@/components/Layout';
import LinkedPlatformsPanel from '@/components/linked/LinkedPlatformsPanel';
import { useAuthContext } from '@/contexts/AuthContext';

export default function LinkedPlatforms() {
  const { user, isCEO } = useAuthContext();
  return (
    <Layout>
      <LinkedPlatformsPanel userId={user?.id} ownerOverride={!!isCEO} />
    </Layout>
  );
}
