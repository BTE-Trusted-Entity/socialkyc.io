import { data } from './data.js';

const [signer] = await ethereum.request({ method: 'eth_requestAccounts' });
const signature = await ethereum.request({
  method: 'eth_signTypedData_v3',
  params: [signer, JSON.stringify(data)],
  from: signer,
});

console.log(`Signer: ${signer}`);
console.log(`Signature: ${signature}`);
