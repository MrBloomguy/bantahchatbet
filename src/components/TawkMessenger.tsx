import React, { useState, useEffect } from 'react';
import ChatSkeleton from './ChatSkeleton';

const TawkMessenger: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for the iframe
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading && <ChatSkeleton />}
      <iframe
        src="https://tawk.to/chat/652ad137eb150b3fb9a15f82/1hcnk2i67"
        style={{
          width: '100%',
          height: 'calc(100vh - 64px)',
          border: '0',
          margin: '0',
          padding: '0',
          display: isLoading ? 'none' : 'block',
        }}
        frameBorder="0"
        scrolling="no"
        title="Live Chat"
        allow="microphone; camera"
        onLoad={() => setIsLoading(false)}
      />
    </>
  );
};

export default TawkMessenger;
