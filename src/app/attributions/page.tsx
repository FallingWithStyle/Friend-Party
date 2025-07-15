'use client';

import { useEffect } from 'react';

export default function AttributionsPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://gist.github.com/hperantunes/f4c2fd407c2ea74c6c9d.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Attributions</h1>
      <p>The d20 icon used in this application was created by hperantunes and is available on GitHub Gist.</p>
      <p>
        <a href="https://gist.github.com/hperantunes/f4c2fd407c2ea74c6c9d" target="_blank" rel="noopener noreferrer">
          View the original Gist
        </a>
      </p>
      <div id="gist-container"></div>
    </div>
  );
}