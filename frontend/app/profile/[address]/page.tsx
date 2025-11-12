import { ProfilePageClient } from '@/components/ProfilePageClient'

export default function ProfilePage({ params }: { params: { address: string } }) {
  return <ProfilePageClient address={params.address} />
}
