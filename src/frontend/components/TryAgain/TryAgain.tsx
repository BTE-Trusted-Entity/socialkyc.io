import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';

interface Props {
  onClick: () => void;
}

export function TryAgain({ onClick }: Props): JSX.Element {
  return (
    <button type="button" className={flowStyles.ctaButton} onClick={onClick}>
      Try again
    </button>
  );
}
