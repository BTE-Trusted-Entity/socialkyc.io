import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlLinkedIn = getVariantRoute(
  paths.oauth.linkedIn,
  'index.html',
);
