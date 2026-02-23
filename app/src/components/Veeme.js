import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/veeme.css';
const SAMPLE_VIDEOS = [
  { id: 1, src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', username: 'adventures', fullName: 'Adventure Seeker', likes: 12400, caption: 'Epic moments' },
  { id: 2, src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', username: 'traveler', fullName: 'Wanderlust', likes: 8900, caption: 'Escaping the ordinary' },
  { id: 3, src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', username: 'funzone', fullName: 'Fun Zone', likes: 15600, caption: 'Life is too short for boring' },
  { id: 4, src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', username: 'thrills', fullName: 'Thrill Seeker', likes: 21000, caption: 'Ride or die' },
  { id: 5, src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', username: 'chaos', fullName: 'Chaos Queen', likes: 7200, caption: 'Mood' },
  { id: 6, src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', username: 'dreamer', fullName: 'Dream Big', likes: 34000, caption: 'Dream bigger' },
];

const generateMoreVideos = (startId) => {
  const clips = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  ];
  const names = ['explorer', 'creator', 'vibes', 'daily', 'lifestyle'];
  return Array.from({ length: 4 }, (_, i) => ({
    id: startId + i,
    src: clips[(startId + i) % clips.length],
    username: names[(startId + i) % names.length],
    fullName: names[(startId + i) % names.length],
    likes: Math.floor(Math.random() * 20000) + 1000,
    caption: 'Another short'
  }));
};

const VeemeShort = ({ video, isActive }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <div className={`veeme-card ${isActive ? 'active' : ''}`}>
      <video
        ref={videoRef}
        src={video.src}
        loop
        muted
        playsInline
        className="veeme-video"
      />
      <div className="veeme-overlay">
        <div className="veeme-side-actions">
          <div className="veeme-avatar">
            <img src="/default-avatar.png" alt={video.username} />
          </div>
          <button className="veeme-action-btn" type="button">❤️</button>
          <span className="veeme-action-count">{video.likes >= 1000 ? `${(video.likes / 1000).toFixed(1)}K` : video.likes}</span>
          <button className="veeme-action-btn" type="button">💬</button>
          <span className="veeme-action-count">42</span>
          <button className="veeme-action-btn" type="button">↗️</button>
          <span className="veeme-action-count">Share</span>
        </div>
        <div className="veeme-info">
          <span className="veeme-username">@{video.username}</span>
          <p className="veeme-caption">{video.caption}</p>
        </div>
      </div>
    </div>
  );
};

const Veeme = ({ currentUser }) => {
  const [videos, setVideos] = useState(SAMPLE_VIDEOS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const feedRef = useRef(null);
  const lastIdRef = useRef(6);
  const loadingRef = useRef(false);

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setTimeout(() => {
      const more = generateMoreVideos(lastIdRef.current + 1);
      lastIdRef.current = more[more.length - 1].id;
      setVideos(prev => [...prev, ...more]);
      setLoading(false);
      loadingRef.current = false;
    }, 800);
  }, []);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const index = Math.round(scrollTop / clientHeight);
      setActiveIndex(index);

      if (scrollHeight - scrollTop - clientHeight < clientHeight * 0.5) {
        loadMore();
      }
    };

    el.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [videos, loadMore]);

  return (
    <div className="veeme-container">
      <div className="veeme-header">
        <h1>Veeme</h1>
        <p className="veeme-tagline">Short videos, endless scroll</p>
      </div>
      <div className="veeme-feed" ref={feedRef}>
        {videos.map((video, index) => (
          <VeemeShort
            key={video.id}
            video={video}
            isActive={index === activeIndex}
          />
        ))}
      </div>
      {loading && (
        <div className="veeme-loading">
          <span className="veeme-loading-spinner" />
          Loading more...
        </div>
      )}
    </div>
  );
};

export default Veeme;
