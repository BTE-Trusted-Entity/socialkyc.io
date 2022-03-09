import { recoverTypedSignature } from '@metamask/eth-sig-util';
import { toChecksumAddress } from 'ethereumjs-util';

const signer = '0x2363b86720473dddb374f22a68d8d7894f8db060';
const signature =
  '0x2b08286d6acf4feb53b91a1c19e4fc4a9d5518ce7b9bcfc917ab7fbc8a4d86ef377122ee933664251411b8a647609adc32d3976b7fad4bd8db29f5ae42e13f861c';

const recovered = recoverTypedSignature({
  version: 'V3',
  signature,
  data,
});
const valid = toChecksumAddress(recovered) === toChecksumAddress(signer);

console.log(valid);
