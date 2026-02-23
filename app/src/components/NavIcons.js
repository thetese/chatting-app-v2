/**
 * Navigation Icons - SVG icons for nav items
 * Styled to match the green/yellow/blue theme
 */

const iconProps = {
  width: 22,
  height: 22,
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
};

export const HomeIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const ExploreIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export const CreateIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const MessagesIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const ActivityIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export const WebIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const ProfileIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const PhotoIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

export const VideoIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

export const VeemeIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

export const EmojiIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

export const AdminIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
