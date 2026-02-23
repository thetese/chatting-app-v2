import React, { useState, useCallback } from 'react';
import '../styles/webview.css';
import { isValidUrl } from '../utils/helpers';

/**
 * WebView Component
 * In-app browser for viewing web pages
 */
const WebView = () => {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ensureProtocol = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleNavigate = useCallback((e) => {
    e?.preventDefault();
    const targetUrl = ensureProtocol(url);
    if (!targetUrl) {
      setError('Please enter a URL');
      return;
    }
    if (!isValidUrl(targetUrl)) {
      setError('Please enter a valid URL');
      return;
    }
    setError(null);
    setLoading(true);
    setCurrentUrl(targetUrl);
  }, [url]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load this page. Some sites block embedding.');
  };

  const openInNewTab = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="webview-container">
      <div className="webview-toolbar">
        <form onSubmit={handleNavigate} className="webview-url-form">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="Enter URL (e.g. https://example.com)"
            className="webview-url-input"
          />
          <button type="submit" className="webview-go-btn">
            Go
          </button>
        </form>
        {currentUrl && (
          <button
            type="button"
            onClick={openInNewTab}
            className="webview-external-btn"
            title="Open in new tab"
          >
            ↗ Open in new tab
          </button>
        )}
      </div>

      {error && <div className="webview-error">{error}</div>}

      <div className="webview-frame-wrapper">
        {loading && (
          <div className="webview-loading">
            <span className="webview-spinner" />
            Loading...
          </div>
        )}
        {currentUrl ? (
          <iframe
            src={currentUrl}
            title="Web view"
            className="webview-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        ) : (
          <div className="webview-placeholder">
            <span className="webview-placeholder-icon">🌐</span>
            <p>Enter a URL above to browse the web</p>
            <p className="webview-placeholder-hint">
              Try https://example.com or any other website
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebView;
