import { TokenPageClient } from './TokenPageClient'

export default async function CompleteTokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  
  return <TokenPageClient address={address} />
}
}
