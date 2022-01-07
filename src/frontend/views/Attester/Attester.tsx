import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import cx from 'classnames';
import { detect } from 'detect-browser';

import * as styles from './Attester.module.css';

import { apiWindow, getSession, Session } from '../../utilities/session';

import { exceptionToError } from '../../utilities/exceptionToError';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { Spinner } from '../../components/Spinner/Spinner';
import { Email } from '../Email/Email';
import { Twitter } from '../Twitter/Twitter';
import { paths } from '../../paths';

interface HasSporran {
  data?: {
    hasSporran: boolean;
  };
}

function useHasSporran(): HasSporran {
  const [hasSporran, setHasSporran] = useState<boolean>();

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Boolean(apiWindow.kilt.sporran)) {
        setHasSporran(true);
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      if (hasSporran === undefined) {
        setHasSporran(false);
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
      clearInterval(timeoutId);
    };
  }, [hasSporran]);

  return typeof hasSporran === 'boolean' ? { data: { hasSporran } } : {};
}

function Welcome() {
  return (
    <Fragment>
      <h1 className={styles.heading}>Your Identity, back in your hands!</h1>

      <p>
        Create your decentralized social credentials here. Your personal data
        will be anchored on the KILT blockchain and only you will decide who can
        access it.
      </p>
      <p>
        SocialKYC does not store, share or sell any of your data. The service
        forgets about you after attesting your identity.
      </p>
    </Fragment>
  );
}

function Unsupported() {
  return (
    <section className={styles.unsupported}>
      <p>
        Attesting credentials requires a wallet extension. Your mobile browser
        does not seem to support extensions.
      </p>
      <p>Please visit SocialKYC using a browser on your computer.</p>
    </section>
  );
}

function Install() {
  const browser = detect();
  if (!browser) {
    return <Unsupported />;
  }

  const { name, os } = browser;

  const isDesktop = os !== 'iOS' && os !== 'Android OS';
  const isChromeOrFirefox = name === 'chrome' || name === 'firefox';

  const showWebstoreLink = isDesktop && isChromeOrFirefox;
  const showWebsiteLink = isDesktop && !isChromeOrFirefox;

  if (showWebstoreLink) {
    return (
      <section className={styles.install}>
        <p>
          To create your Identity for using SocialKYC credentials, you will need
          to install the Sporran wallet which is a browser extension. Download
          Sporran here:
        </p>
        {name === 'chrome' && (
          <a
            className={styles.chrome}
            href="https://chrome.google.com/webstore/detail/djdnajgjcbjhhbdblkegbcgodlkkfhcl"
          />
        )}
        {name === 'firefox' && (
          <a
            className={styles.firefox}
            href="https://addons.mozilla.org/firefox/addon/sporran/"
          />
        )}
      </section>
    );
  }

  if (showWebsiteLink) {
    return (
      <section className={styles.install}>
        <p>
          Please make sure to have a wallet extension installed for your
          browser. We recommend the
          <br />
          <a className={styles.textLink} href="https://www.sporran.org/">
            Sporran extension.
          </a>
        </p>
      </section>
    );
  }

  return <Unsupported />;
}

function GetCredentials() {
  return (
    <Fragment>
      <p>Get verifiable credentials for your:</p>

      <ul className={styles.credentials}>
        <li>
          <Link to={paths.twitter} className={styles.twitter}>
            Twitter Account
          </Link>
        </li>
        <li>
          <Link to={paths.email} className={styles.email}>
            Email Address
          </Link>
        </li>
      </ul>
    </Fragment>
  );
}

function Connect({ setSession }: { setSession: (s: Session) => void }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<'closed' | 'rejected' | 'unknown'>();

  const handleConnectClick = useCallback(
    async (event) => {
      try {
        event.preventDefault();
        setProcessing(true);
        setError(undefined);

        setSession(await getSession());
      } catch (exception) {
        const { message } = exceptionToError(exception);
        // TODO: need to conform to the spec
        if (message.includes('closed')) {
          setError('closed');
        } else if (message.includes('Not authorized')) {
          setError('rejected');
        } else {
          setError('unknown');
          console.error(exception);
        }
      } finally {
        setProcessing(false);
      }
    },
    [setSession],
  );

  return (
    <section className={styles.connectContainer}>
      <div
        className={cx(styles.connect, {
          [styles.processing]: processing,
        })}
      >
        {!error && <p>Please authorize access to your wallet.</p>}

        {error === 'closed' && (
          <DetailedMessage
            icon="exclamation"
            heading="Authorization error:"
            message="Your wallet was closed before access was authorized."
            details="Please try again to authorize access to it."
          />
        )}

        {error === 'rejected' && (
          <DetailedMessage
            icon="exclamation"
            heading="Authorization error:"
            message="The authorization was rejected."
            details="Follow the instructions on our Tech Support site to establish the connection between SocialKYC and your wallet."
          />
        )}

        {error === 'unknown' && (
          <DetailedMessage
            icon="exclamation"
            heading="Authorization error:"
            message="Something went wrong!"
            details="Click “Connect to Wallet” or reload the page or restart your browser."
          />
        )}

        {error === 'rejected' ? (
          <a
            href="https://support.kilt.io/support/solutions/articles/80000968082-how-to-grant-access-to-website"
            target="_blank"
            rel="noreferrer"
            className={styles.buttonLink}
          >
            Tech Support
          </a>
        ) : (
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={handleConnectClick}
            disabled={processing}
          >
            Connect to wallet
          </button>
        )}
      </div>

      {processing && <Spinner />}
    </section>
  );
}

function AlmostThere(): JSX.Element {
  return (
    <Fragment>
      <h1 className={styles.heading}>Almost there!</h1>
      <p>
        Please connect to your wallet again to continue the attestation process.
      </p>
    </Fragment>
  );
}

function useLogoNavigation() {
  const history = useHistory();
  useEffect(() => {
    document.querySelector('.logo')?.addEventListener('click', (event) => {
      event.preventDefault();
      history.push('/');
    });
  }, [history]);
}

export function Attester(): JSX.Element {
  useLogoNavigation();

  const { data } = useHasSporran();

  const [session, setSession] = useState<Session>();

  if (!data) {
    return <Spinner />;
  }

  const { hasSporran } = data;
  if (!hasSporran) {
    return (
      <Fragment>
        <Welcome />
        <Install />
      </Fragment>
    );
  }

  if (!session) {
    return (
      <Fragment>
        <Switch>
          <Route path={paths.emailConfirmation}>
            <AlmostThere />
          </Route>
          <Route>
            <Welcome />
          </Route>
        </Switch>
        <Connect setSession={setSession} />
      </Fragment>
    );
  }

  return (
    <Switch>
      <Route path={paths.twitter}>
        <Twitter session={session} />
      </Route>
      <Route path={paths.email}>
        <Email session={session} />
      </Route>
      <Route>
        <Welcome />
        <GetCredentials />
      </Route>
    </Switch>
  );
}
