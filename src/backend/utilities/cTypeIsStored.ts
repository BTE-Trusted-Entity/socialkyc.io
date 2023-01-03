import { ICType } from '@kiltprotocol/types';
import { ConfigService } from '@kiltprotocol/config';
import { CType } from '@kiltprotocol/core';

export async function cTypeIsStored({ $id }: ICType): Promise<boolean> {
  const api = ConfigService.get('api');
  return (await api.query.ctype.ctypes(CType.idToChain($id))).isSome;
}
