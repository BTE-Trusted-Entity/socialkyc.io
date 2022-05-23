import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlInstagram = getVariantRoute(
  paths.redirect.instagram,
  'index.html',
);
