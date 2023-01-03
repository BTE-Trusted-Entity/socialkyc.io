import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlEmail = getVariantRoute(
  paths.redirect.email,
  'index.html',
);
