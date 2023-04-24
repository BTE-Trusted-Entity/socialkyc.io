import { Explainer } from '../Explainer/Explainer';

export function OAuthExplainer({ service }: { service: string }) {
  return (
    <Explainer>
      After you sign into your {service} account and give SocialKYC permission,
      SocialKYC requests your {service} information for the credential. You can
      then sign the data with one of your identities in Sporran, and SocialKYC
      will create the credential.
    </Explainer>
  );
}
