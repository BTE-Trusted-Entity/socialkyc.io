import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlDiscord = getVariantRoute(
  paths.discord.authHtml,
  'index.html',
);
