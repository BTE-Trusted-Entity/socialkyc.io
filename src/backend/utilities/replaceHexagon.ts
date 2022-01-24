import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { configuration } from './configuration';

const hexagons = ['hexagon1', 'hexagon2', 'hexagon3'];

function getRandomHexagon() {
  const random = Math.floor(Math.random() * hexagons.length);
  return hexagons[random];
}

export async function replaceHexagon(html: string): Promise<void> {
  const htmlTemplate = await readFile(join(configuration.distFolder, html), {
    encoding: 'utf-8',
  });

  const replaced = htmlTemplate.replace(/hexagon\d/, getRandomHexagon());

  await writeFile(join(configuration.distFolder, html), replaced, {
    encoding: 'utf-8',
  });
}
