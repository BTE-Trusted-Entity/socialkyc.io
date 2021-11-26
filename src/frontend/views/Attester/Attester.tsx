import { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';
import { detect } from 'detect-browser';

import { apiWindow, getSession, Session } from '../../utilities/session';

import { Email } from '../Email/Email';
import { Twitter } from '../Twitter/Twitter';
import { Dotsama } from '../Dotsama/Dotsama';

import * as styles from './Attester.module.css';

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

export function Attester(): JSX.Element {
  const browser = detect();

  const isDesktop =
    browser && browser.os !== 'iOS' && browser.os !== 'Android OS';

  const isSupportedBrowser =
    isDesktop && (browser.name === 'chrome' || browser.name === 'firefox');

  const isUnsupportedBrowser =
    isDesktop && browser.name !== 'chrome' && browser.name !== 'firefox';

  const { data } = useHasSporran();
  const hasSporran = data?.hasSporran;

  const showWebstoreLink = hasSporran === false && isSupportedBrowser;
  const showWebsiteLink = hasSporran === false && isUnsupportedBrowser;

  const [session, setSession] = useState<Session>();

  const [processing, setProcessing] = useState(false);

  const handleConnectClick = useCallback(async (event) => {
    event.preventDefault();
    setProcessing(true);

    try {
      setSession(await getSession());
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  }, []);

  return (
    <div className={styles.leftContainer}>
      <h1 className={styles.heading}>Your IDENTITY, back in your hands!</h1>
      <div className={styles.scrollContainer}>
        <section className={styles.info}>
          <p className={styles.subline}>
            Create your decentralized social credentials here. Your personal
            data will be anchored on the KILT blockchain and only you will
            decide who can access it.
          </p>
          <p className={styles.subline}>
            SocialKYC does not store, share or sell any of your data. The
            service forgets about you after attesting your identity.
          </p>
        </section>

        {!data && <div className={styles.spinner}></div>}

        {hasSporran && !session && (
          <section className={styles.connectContainer}>
            <div
              className={cx(styles.connect, {
                [styles.processing]: processing,
              })}
            >
              <p className={styles.subline}>
                Please authorize access to your wallet
              </p>
              <button
                type="button"
                className={styles.buttonPrimary}
                onClick={handleConnectClick}
                disabled={processing}
              >
                Connect to wallet
              </button>
            </div>
            {processing && <div className={styles.spinner}></div>}
          </section>
        )}

        {hasSporran && session && (
          <section className={styles.lists}>
            <h2 className={styles.subline}>
              Get verifiable credentials for your:
            </h2>
            <ul className={styles.mediaList}>
              <Twitter session={session} />
              <Email session={session} />
              <Dotsama session={session} />
            </ul>
          </section>
        )}

        {showWebstoreLink && (
          <section className={styles.install}>
            <p className={styles.warning}>
              To create your Identity for using SocialKYC credentials, you will
              need to install the Sporran wallet which is a browser extension.
              Download Sporran here:
            </p>
            {browser.name === 'chrome' && (
              <a
                className={styles.chrome}
                href="https://chrome.google.com/webstore/detail/djdnajgjcbjhhbdblkegbcgodlkkfhcl"
              />
            )}
            {browser.name === 'firefox' && (
              <a
                className={styles.firefox}
                href="https://addons.mozilla.org/firefox/addon/sporran/"
              />
            )}
          </section>
        )}

        {showWebsiteLink && (
          <section className={styles.install}>
            <p className={styles.warning}>
              Please make sure to have a wallet extension installed for your
              browser. We recommend the
              <br />
              <a className={styles.textLink} href="https://www.sporran.org/">
                Sporran extension.
              </a>
            </p>
          </section>
        )}

        {/* TODO: Handle case of mobile device */}
      </div>
    </div>
  );
}
