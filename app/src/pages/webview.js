import React from 'react';
import WebView from '../components/WebView';
import '../styles/pages.css';

/**
 * WebView Page
 * In-app browser for viewing web pages
 */
const WebViewPage = () => {
  return (
    <div className="page-container webview-page">
      <WebView />
    </div>
  );
};

export default WebViewPage;
