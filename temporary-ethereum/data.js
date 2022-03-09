const domain = {
  name: 'SocialKYC',
  version: '1',
  chainId: 1,
  salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
};

const types = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'salt', type: 'bytes32' },
  ],
  Message: [{ name: 'challenge', type: 'bytes32' }],
};

const message = {
  challenge:
    '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
};

export const data = {
  domain,
  types,
  message,
  primaryType: 'Message',
};

