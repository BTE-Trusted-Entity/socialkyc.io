import type { ICType } from '@kiltprotocol/types';

import { CType } from '@kiltprotocol/credentials';
import { ConfigService } from '@kiltprotocol/sdk-js';

export async function cTypeIsStored({ $id }: ICType): Promise<boolean> {
  const api = ConfigService.get('api');
  return (await api.query.ctype.ctypes(CType.idToChain($id))).isSome;
}
