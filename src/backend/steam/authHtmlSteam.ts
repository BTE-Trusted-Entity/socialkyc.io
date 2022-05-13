import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlSteam = getVariantRoute(paths.steam.auth, 'index.html');
