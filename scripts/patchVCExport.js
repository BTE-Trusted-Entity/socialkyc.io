import { readFile, writeFile } from 'node:fs/promises';

// This script patches the SDK
// * for the missing import type assertions when importing JSON inside
// * for the jsonld-signatures being CommonJS

{
  const fileName =
    '/app/node_modules/@kiltprotocol/vc-export/lib/esm/vc-js/context/index.js';
  const text = await readFile(fileName, { encoding: 'utf-8' });
  const patched = text.replace(
    `import context from './context.json'`,
    `import context from './context.json' assert { type: 'json' }`,
  );
  await writeFile(fileName, patched);
}

{
  const fileName =
    '/app/node_modules/@kiltprotocol/vc-export/lib/esm/vc-js/suites/KiltAbstractSuite.js';
  const text = await readFile(fileName, { encoding: 'utf-8' });
  const patched = text
    .replace(
      `import { suites, } from 'jsonld-signatures'`,
      `import jsonldSignatures from 'jsonld-signatures'`,
    )
    .replace(
      `extends suites.LinkedDataProof`,
      `extends jsonldSignatures.suites.LinkedDataProof`,
    );
  await writeFile(fileName, patched);
}
