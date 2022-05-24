import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlInstagram = getVariantRoute(
  paths.oauth.instagram,
  'index.html',
);
