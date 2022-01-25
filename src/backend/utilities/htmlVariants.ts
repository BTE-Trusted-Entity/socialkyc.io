import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ServerRoute } from '@hapi/hapi';

import { configuration } from './configuration';

const files = {
  home: 'index.html',
  about: 'about.html',
  terms: 'terms.html',
  privacy: 'privacy.html',
};

const htmlVariants: Record<string, string[]> = {};

export async function produceHtmlVariants() {
  for (const file of Object.values(files)) {
    htmlVariants[file] = [];
    const template = await readFile(join(configuration.distFolder, file), {
      encoding: 'utf-8',
    });
    htmlVariants[file].push(template);
    htmlVariants[file].push(template.replace('hexagon1', 'hexagon2'));
    htmlVariants[file].push(template.replace('hexagon1', 'hexagon3'));
  }
}

export function getHtmlVariant(file: string) {
  const random = Math.floor(Math.random() * htmlVariants[file].length);
  return htmlVariants[file][random];
}

export function getVariantRoute(path: string, file: string): ServerRoute {
  return {
    method: 'GET',
    path,
    handler: () => getHtmlVariant(file),
    options: {
      files: {
        relativeTo: configuration.distFolder,
      },
    },
  };
}
