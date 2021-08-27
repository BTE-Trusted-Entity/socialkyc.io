import path from 'node:path';

import { NextFunction, Request, Response } from 'express';

import { configuration } from '../utilities/configuration';
import { getRequestForAttestation } from '../utilities/requestCache';

export async function confirmationHtml(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Page will not render if some random or incorrect key is entered in the URL
    const { key } = req.params;
    getRequestForAttestation(key);
  } catch (error) {
    next(error);
  }

  res.sendFile(path.join(configuration.distFolder, 'confirmation.html'));
}
