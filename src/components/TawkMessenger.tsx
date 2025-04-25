import React, { useState, useEffect, useRef } from 'react';
import ChatSkeleton from './ChatSkeleton';
import { MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import styles from './TawkMessenger.module.css';

const TawkMessenger: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to handle iframe load success
  const handleIframeLoad = () => {
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
    }
    setIsLoading(false);
    setLoadingFailed(false);
  };

  // Function to retry loading the chat
  const handleRetry = () => {
    setIsLoading(true);
    setLoadingFailed(false);
    setLoadingTime(0);

    // Reset the iframe by changing its src
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  };

  useEffect(() => {
    // Start a timer to track loading time
    loadingTimerRef.current = setInterval(() => {
      setLoadingTime(prev => {
        const newTime = prev + 1;

        // If loading takes more than 15 seconds, show failure message
        if (newTime >= 15) {
          setLoadingFailed(true);
          setIsLoading(false);
          if (loadingTimerRef.current) {
            clearInterval(loadingTimerRef.current);
          }
        }

        return newTime;
      });
    }, 1000);

    // Minimum skeleton display time (3 seconds)
    const minLoadingTimer = setTimeout(() => {
      // Only hide skeleton if iframe has loaded successfully
      if (iframeRef.current?.contentWindow?.document.readyState === 'complete') {
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
      clearTimeout(minLoadingTimer);
    };
  }, []);

  return (
    <>
      {isLoading && <ChatSkeleton />}

      {loadingFailed && (
        <div className={styles.errorContainer}>
          <AlertCircle className={styles.errorIcon} />
          <h3 className={styles.errorTitle}>Chat Service Unavailable</h3>
          <p className={styles.errorMessage}>
            We're having trouble connecting to our chat service. This could be due to network issues or the service may be temporarily down.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className={styles.retryButton}
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
          <div className={styles.alternativeContact}>
            <h4 className={styles.contactTitle}>
              <MessageSquare className={styles.contactIcon} />
              Alternative Contact Methods
            </h4>
            <p className={styles.contactText}>
              You can also reach our support team at <a href="mailto:support@bantah.com" className={styles.contactLink}>support@bantah.com</a> or via our social media channels.
            </p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src="https://tawk.to/chat/652ad137eb150b3fb9a15f82/1hcnk2i67"
        className={`${styles.tawkIframe} ${isLoading || loadingFailed ? styles.hidden : styles.visible}`}
        frameBorder="0"
        scrolling="no"
        title="Live Chat"
        allow="microphone; camera"
        onLoad={handleIframeLoad}
      />
    </>
  );
};

export default TawkMessenger;
