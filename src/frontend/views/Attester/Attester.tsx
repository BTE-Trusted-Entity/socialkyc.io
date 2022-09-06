import {
  FormEvent,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import cx from 'classnames';
import { detect } from 'detect-browser';

import * as styles from './Attester.module.css';

import {
  apiWindow,
  ClosedRejection,
  getSession,
  Session,
  UnauthorizedRejection,
} from '../../utilities/session';
import {
  redirectedPaths,
  useValuesFromRedirectUri,
} from '../../utilities/useValuesFromRedirectUri';
import { paths } from '../../paths';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { Spinner } from '../../components/Spinner/Spinner';
import { Email } from '../Email/Email';
import { Twitter } from '../Twitter/Twitter';
import { Discord } from '../Discord/Discord';
import { Github } from '../Github/Github';
import { Twitch } from '../Twitch/Twitch';
import { Telegram } from '../Telegram/Telegram';
import { Youtube } from '../Youtube/Youtube';
import { Disconnect } from '../../components/Disconnect/Disconnect';
import { Instagram } from '../Instagram/Instagram';

interface HasExtension {
  data?: {
    hasExtension: boolean;
  };
}

function useHasExtension(): HasExtension {
  const [hasExtension, setHasExtension] = useState<boolean>();

  const { kilt } = apiWindow;

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Object.entries(kilt).length > 0) {
        setHasExtension(true);
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      if (hasExtension === undefined) {
        setHasExtension(false);
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
      clearInterval(timeoutId);
    };
  }, [hasExtension, kilt]);

  return typeof hasExtension === 'boolean' ? { data: { hasExtension } } : {};
}

function Welcome() {
  return (
    <Fragment>
      <h1 className={styles.heading}>Your Identity, back in your hands!</h1>

      <p>
        Create your decentralized social credentials here. You decide who has
        access to your data and only the validity of your credential is anchored
        on the blockchain.
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
        <li>
          <Link to={paths.discord} className={styles.discord}>
            Discord Account
          </Link>
        </li>
        <li>
          <Link to={paths.github} className={styles.github}>
            GitHub Account
          </Link>
        </li>
        <li>
          <Link to={paths.twitch} className={styles.twitch}>
            Twitch Account
          </Link>
        </li>
        <li>
          <Link to={paths.telegram} className={styles.telegram}>
            Telegram Account
          </Link>
        </li>
        <li>
          <Link to={paths.youtube} className={styles.youtube}>
            YouTube Channel
          </Link>
        </li>
        <li>
          <Link to={paths.instagram} className={styles.instagram}>
            Instagram Account
          </Link>
        </li>
      </ul>
    </Fragment>
  );
}

function Connect({ setSession }: { setSession: (s: Session) => void }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<'closed' | 'rejected' | 'unknown'>();

  const { kilt } = apiWindow;
  const extensions = useMemo(() => Object.keys(kilt), [kilt]);

  const [extension, setExtension] = useState<string>(extensions[0]);

  const { search } = useLocation();
  const { secret } = useValuesFromRedirectUri();
  const isRedirected = Boolean(secret);

  useEffect(() => {
    const wallet =
      new URLSearchParams(search).get('wallet') ||
      window.sessionStorage.getItem('wallet');

    if (wallet && extensions.includes(wallet)) {
      setExtension(wallet);
    }

    if (!wallet && extensions.includes('sporran')) {
      setExtension('sporran');
    }
  }, [extensions, search]);

  const handleInput = useCallback((event: FormEvent<HTMLSelectElement>) => {
    setExtension((event.target as HTMLSelectElement).value);
  }, []);

  const handleConnect = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      if (!extension) {
        return;
      }
      try {
        event.preventDefault();
        setProcessing(true);
        setError(undefined);

        setSession(await getSession(kilt[extension], extension));
      } catch (exception) {
        if (exception instanceof ClosedRejection) {
          setError('closed');
        } else if (exception instanceof UnauthorizedRejection) {
          setError('rejected');
        } else {
          setError('unknown');
          console.error(exception);
        }
        setProcessing(false);
      }
    },
    [extension, setSession, kilt],
  );

  return (
    <form onSubmit={handleConnect} className={styles.connectContainer}>
      <div
        className={cx(styles.connect, {
          [styles.processing]: processing,
        })}
      >
        {!error && isRedirected && (
          <p className={styles.authorize}>
            Please authorize access to your wallet.
          </p>
        )}

        {!error && !isRedirected && (
          <div>
            <label className={styles.extension}>
              First select your wallet
              <select
                className={styles.extensionInput}
                name="selected"
                onInput={handleInput}
                value={extension}
                autoFocus
              >
                {extensions.map((extension) => (
                  <option
                    value={extension}
                    label={kilt[extension].name}
                    key={extension}
                  />
                ))}
              </select>
            </label>
            <p className={styles.authorize}>Then authorize access to it</p>
          </div>
        )}

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
            type="submit"
            className={styles.buttonPrimary}
            disabled={processing}
          >
            Connect to wallet
          </button>
        )}
      </div>

      {processing && <Spinner />}
    </form>
  );
}

function AlmostThere(): JSX.Element {
  return (
    <Fragment>
      <h1 className={styles.heading}>Almost there!</h1>
      <p>
        Please connect to your wallet again to see the status of the attestation
        process.
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

  const { data } = useHasExtension();

  const [session, setSession] = useState<Session>();
  const clearSession = useCallback(() => setSession(undefined), []);

  if (!data) {
    return <Spinner />;
  }

  const { hasExtension } = data;
  if (!hasExtension) {
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
          <Route path={redirectedPaths}>
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
    <Fragment>
      <Disconnect session={session} onDisconnect={clearSession} />

      <Switch>
        <Route path={paths.twitter}>
          <Twitter session={session} />
        </Route>
        <Route path={paths.email}>
          <Email session={session} />
        </Route>
        <Route path={paths.discord}>
          <Discord session={session} />
        </Route>
        <Route path={paths.github}>
          <Github session={session} />
        </Route>
        <Route path={paths.twitch}>
          <Twitch session={session} />
        </Route>
        <Route path={paths.telegram}>
          <Telegram session={session} />
        </Route>
        <Route path={paths.youtube}>
          <Youtube session={session} />
        </Route>
        <Route path={paths.instagram}>
          <Instagram session={session} />
        </Route>
        <Route>
          <Welcome />
          <GetCredentials />
        </Route>
      </Switch>
    </Fragment>
  );
}
