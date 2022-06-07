import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlYoutube = getVariantRoute(
  paths.redirect.youtube,
  'index.html',
);
