import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ServerRoute,
} from '@hapi/hapi';

import { configuration } from './configuration';

const hexagons = ['hexagon1', 'hexagon2', 'hexagon3'];

function getRandomHexagon() {
  const random = Math.floor(Math.random() * hexagons.length);
  return hexagons[random];
}

export async function replaceHexagon(htmlFile: string): Promise<void> {
  const htmlTemplate = await readFile(
    join(configuration.distFolder, htmlFile),
    {
      encoding: 'utf-8',
    },
  );

  const replaced = htmlTemplate.replace(/\bhexagon\d\b/, getRandomHexagon());

  await writeFile(join(configuration.distFolder, htmlFile), replaced, {
    encoding: 'utf-8',
  });
}

export function getRandomHexagonRoute(
  path: string,
  htmlFile: string,
): ServerRoute {
  async function handler(
    request: Request,
    h: ResponseToolkit,
  ): Promise<ResponseObject> {
    const { logger } = request;

    await replaceHexagon(htmlFile);

    logger.debug(`${htmlFile} overwritten with new random hexagon`);

    return h.file(htmlFile);
  }

  return {
    method: 'GET',
    path,
    handler,
    options: {
      files: {
        relativeTo: configuration.distFolder,
      },
    },
  };
}
