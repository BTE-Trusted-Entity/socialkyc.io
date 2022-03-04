import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  Link,
  Route,
  Switch,
  useHistory,
  useRouteMatch,
} from 'react-router-dom';
import cx from 'classnames';
import { detect } from 'detect-browser';

import * as styles from './Attester.module.css';

import {
  apiWindow,
  getSession,
  Session,
  getWindowExtensions,
} from '../../utilities/session';

import { exceptionToError } from '../../utilities/exceptionToError';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { Spinner } from '../../components/Spinner/Spinner';
import { Email } from '../Email/Email';
import { Twitter } from '../Twitter/Twitter';
import { paths } from '../../paths';
import { Discord } from '../Discord/Discord';
import { Github } from '../Github/Github';
import { Disconnect } from '../../components/Disconnect/Disconnect';
import {
  extensionInput,
  extensionOutput,
} from '../../utilities/broadcastChannels';

interface HasExtension {
  data?: {
    hasExtension: boolean;
  };
}

function useHasExtension(): HasExtension {
  const [hasExtension, setHasExtension] = useState<boolean>();

  useEffect(() => {
    const intervalId = setInterval(() => {
      const extensions = getWindowExtensions();
      if (extensions.length > 0) {
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
  }, [hasExtension]);

  return typeof hasExtension === 'boolean' ? { data: { hasExtension } } : {};
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
      </ul>
    </Fragment>
  );
}

function Connect({ setSession }: { setSession: (s: Session) => void }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<'closed' | 'rejected' | 'unknown'>();

  const { kilt } = apiWindow;
  const extensions = Object.keys(kilt);

  const [extension, setExtension] = useState<string>('');

  const isEmailConfirmation = useRouteMatch(paths.emailConfirmation);

  useEffect(() => {
    if (isEmailConfirmation) {
      extensionInput.postMessage('GET_BROADCASTED_EXTENSION');

      extensionOutput.onmessage = ({ data: extension }) => {
        setExtension(extension);
      };
    }

    if (!isEmailConfirmation) {
      if (extensions.length === 1) {
        setExtension(extensions[0]);
        return;
      }
      for (const extension of extensions) {
        if (extension === 'sporran') {
          setExtension(extension);
          return;
        }
      }
      setExtension(extensions[0]);
    }
  }, [isEmailConfirmation, extensions]);

  const handleInput = useCallback((event) => {
    setExtension(event.target.value);
  }, []);

  const handleConnect = useCallback(
    async (event) => {
      if (!extension) {
        return;
      }
      try {
        event.preventDefault();
        setProcessing(true);
        setError(undefined);

        setSession(await getSession(kilt[extension]));

        extensionInput.onmessage = () => {
          extensionOutput.postMessage(extension);
        };
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
        setProcessing(false);
      }
    },
    [extension, setSession, kilt],
  );

  if (!extension) {
    return null;
  }

  return (
    <form onSubmit={handleConnect} className={styles.connectContainer}>
      <div
        className={cx(styles.connect, {
          [styles.processing]: processing,
        })}
      >
        {!error && isEmailConfirmation && (
          <p className={styles.authorize}>
            Please authorize access to your wallet.
          </p>
        )}

        {!error && !isEmailConfirmation && (
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
          <Route
            path={[
              paths.emailConfirmation,
              paths.discordAuth,
              paths.githubAuth,
            ]}
          >
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
        <Route>
          <Welcome />
          <GetCredentials />
        </Route>
      </Switch>
    </Fragment>
  );
}
