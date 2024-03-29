import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ServerRoute } from '@hapi/hapi';

import { configuration } from './configuration';

const htmlVariants: Record<string, string[]> = {};

export async function getHtmlVariant(file: string): Promise<string> {
  if (!htmlVariants[file] || htmlVariants[file].length === 0) {
    const baseTemplate = await readFile(join(configuration.distFolder, file), {
      encoding: 'utf-8',
    });
    const template = !configuration.isTestEnvironment
      ? baseTemplate
      : baseTemplate.replace(
          'data-test-environment=""',
          'data-test-environment="true"',
        );
    htmlVariants[file] = [
      template,
      template.replace('hexagon1', 'hexagon2'),
      template.replace('hexagon1', 'hexagon3'),
    ];
  }
  const random = Math.floor(Math.random() * htmlVariants[file].length);
  return htmlVariants[file][random];
}

export function getVariantRoute(path: string, file: string): ServerRoute {
  return {
    method: 'GET',
    path,
    handler: async () => await getHtmlVariant(file),
  };
}
