import { TokenPageClient } from './TokenPageClient'

// Fixed React 18 compatibility
export default async function CompleteTokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  
  return <TokenPageClient address={address} />
}
