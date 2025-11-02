export const TOKEN_FACTORY_ABI = [
  // Read Functions
  {
    inputs: [],
    name: 'platformConfig',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'getBondingCurve',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'salt', type: 'bytes32' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'string', name: 'metadataURI', type: 'string' },
    ],
    name: 'predictTokenAddress',
    outputs: [
      { internalType: 'address', name: 'tokenAddr', type: 'address' },
      { internalType: 'address', name: 'bondingCurveAddr', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Write Functions
  {
    inputs: [
      { internalType: 'bytes32', name: 'salt', type: 'bytes32' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'string', name: 'metadataURI', type: 'string' },
    ],
    name: 'createToken',
    outputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'address', name: 'bondingCurve', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: true, internalType: 'address', name: 'bondingCurve', type: 'address' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: false, internalType: 'string', name: 'symbol', type: 'string' },
      { indexed: false, internalType: 'string', name: 'metadataURI', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'TokenCreated',
    type: 'event',
  },
] as const
