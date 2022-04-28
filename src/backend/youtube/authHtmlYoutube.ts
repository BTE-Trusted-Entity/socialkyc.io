import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlYoutube = getVariantRoute(
  paths.oauth.youtube,
  'index.html',
);
