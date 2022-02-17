import { paths } from '../endpoints/paths';
import { getVariantRoute } from '../utilities/htmlVariants';

export const authHtmlGithub = getVariantRoute(paths.oauth.github, 'index.html');
