import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlTwitch = getVariantRoute(paths.oauth.twitch, 'index.html');
