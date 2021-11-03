import ky from 'ky';

import {
  CheckChallengeInput,
  CheckChallengeOutput,
  GetChallengeOutput,
} from './challenge';
import { paths } from './paths';

export async function getChallengeValues(): Promise<GetChallengeOutput> {
  return ky.get(paths.challenge).json();
}

export async function checkChallenge(
  input: CheckChallengeInput,
): Promise<CheckChallengeOutput> {
  await ky.post(paths.challenge, { json: input });
  return undefined;
}
