import { ConfigService, CType, ICType } from '@kiltprotocol/sdk-js';

export async function cTypeIsStored({ $id }: ICType): Promise<boolean> {
  const api = ConfigService.get('api');
  return (await api.query.ctype.ctypes(CType.idToChain($id))).isSome;
}
