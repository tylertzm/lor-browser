import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, ArrowUpLeft, RotateCcw, RotateCw, Music, Disc } from 'lucide-react';

interface MediaInfo {
  hasMedia: boolean;
  isPlaying: boolean;
  mediaType?: 'video' | 'audio';
  currentTime: number;
  duration: number;
  title: string;
  domain: string;
  url?: string;
  tabId?: string;
}

export const ArcPictureInPictureWindow: React.FC = () => {
  const [mediaInfo, setMediaInfo] = useState<MediaInfo>({
    hasMedia: true,
    isPlaying: true,
    mediaType: 'video',
    currentTime: 0,
    duration: 100,
    title: 'Loading media...',
    domain: 'lor.browser'
  });

  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [hasVideoStream, setHasVideoStream] = useState<boolean>(false);
  const hasVideoStreamRef = useRef<boolean>(false);
  const mediaTypeRef = useRef<string | undefined>(mediaInfo.mediaType);

  useEffect(() => {
    mediaTypeRef.current = mediaInfo.mediaType;
  }, [mediaInfo.mediaType]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Listen to live media metadata broadcasts from the origin tab
  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI?.onPiPMediaUpdate) {
      // @ts-ignore
      const cleanup = window.electronAPI.onPiPMediaUpdate((info: MediaInfo) => {
        if (info) {
          setMediaInfo((prev) => ({
            ...prev,
            ...info,
            title: info.title || prev.title,
            domain: info.domain || prev.domain
          }));
        }
      });
      return cleanup;
    }
  }, []);

  // WebRTC Stream Negotiation with Main Window
  useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI?.onPiPSignal) return;

    const pc = new RTCPeerConnection({
      iceServers: []
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (videoRef.current) {
        const stream = (event.streams && event.streams[0])
          ? event.streams[0]
          : new MediaStream([event.track]);
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        hasVideoStreamRef.current = true;
        setHasVideoStream(true);

        const videoTrack = stream.getVideoTracks()[0] || event.track;
        if (videoTrack) {
          videoTrack.onended = () => {
            hasVideoStreamRef.current = false;
            setHasVideoStream(false);
          };
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // @ts-ignore
        window.electronAPI.pipSignal({ type: 'candidate', candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        hasVideoStreamRef.current = false;
        setHasVideoStream(false);
      }
    };

    // @ts-ignore
    const cleanupSignal = window.electronAPI.onPiPSignal(async (signal: any) => {
      try {
        if (signal.type === 'offer' && signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (pc.iceGatheringState !== 'complete') {
            await new Promise((resolve) => {
              const check = () => {
                if (pc.iceGatheringState === 'complete') {
                  pc.removeEventListener('icegatheringstatechange', check);
                  resolve(null);
                }
              };
              pc.addEventListener('icegatheringstatechange', check);
              setTimeout(() => resolve(null), 600);
            });
          }

          // @ts-ignore
          window.electronAPI.pipSignal({
            type: 'answer',
            sdp: JSON.parse(JSON.stringify(pc.localDescription || answer))
          });
        } else if (signal.type === 'candidate' && signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
        }
      } catch (err) {
        console.warn('[PiP WebRTC] Signal error:', err);
      }
    });

    // Request stream from origin tab
    const requestStream = () => {
      // @ts-ignore
      window.electronAPI?.pipSignal?.({ type: 'request-stream' });
    };

    requestStream();
    const retryTimer = setInterval(() => {
      if (!hasVideoStreamRef.current && mediaTypeRef.current !== 'audio') {
        requestStream();
      }
    }, 2000);

    return () => {
      clearInterval(retryTimer);
      cleanupSignal();
      pc.close();
      pcRef.current = null;
      hasVideoStreamRef.current = false;
    };
  }, []);

  // Auto-hide controls when playing and idle
  const resetControlsTimer = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (mediaInfo.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (mediaInfo.isPlaying) {
          setControlsVisible(false);
        }
      }, 2400);
    }
  };

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  // Play / Pause Toggle
  const handleTogglePlay = () => {
    // @ts-ignore
    window.electronAPI?.pipSendControl?.('togglePlay');
    setMediaInfo((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    resetControlsTimer();
  };

  // Jump 15s Rewind / Fast Forward
  const handleJump = (seconds: number) => {
    // @ts-ignore
    window.electronAPI?.pipSendControl?.('jump', seconds);
    setMediaInfo((prev) => {
      const target = Math.max(0, Math.min(prev.duration || 100, prev.currentTime + seconds));
      return { ...prev, currentTime: target };
    });
    resetControlsTimer();
  };

  // Scrub timeline
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percent * (mediaInfo.duration || 100);
    // @ts-ignore
    window.electronAPI?.pipSendControl?.('seek', { time: targetTime });
    setMediaInfo((prev) => ({ ...prev, currentTime: targetTime }));
    resetControlsTimer();
  };

  // Return to origin tab
  const handleBackToTab = () => {
    // @ts-ignore
    if (window.electronAPI?.pipBackToTab && mediaInfo.tabId) {
      // @ts-ignore
      window.electronAPI.pipBackToTab(mediaInfo.tabId);
    } else {
      // @ts-ignore
      window.electronAPI?.pipClose?.();
    }
  };

  // Close PiP
  const handleClose = () => {
    // @ts-ignore
    window.electronAPI?.pipClose?.();
  };

  const progressPercent = mediaInfo.duration > 0
    ? Math.min(100, Math.max(0, (mediaInfo.currentTime / mediaInfo.duration) * 100))
    : 0;

  const isAudioMode = mediaInfo.mediaType === 'audio' || !hasVideoStream;

  return (
    <div
      className={`lor-pip-viewport ${controlsVisible || !mediaInfo.isPlaying ? 'show-controls' : 'hide-controls'}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setIsHovered(true);
        resetControlsTimer();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (mediaInfo.isPlaying) {
          setControlsVisible(false);
        }
      }}
    >
      {/* Live Video Feed Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`lor-pip-video-surface ${hasVideoStream ? 'visible' : 'hidden'}`}
      />

      {/* Music / Audio / Fallback Visualizer Background */}
      {isAudioMode && (
        <div className="lor-pip-audio-visualizer-surface">
          <div className="lor-audio-backdrop-glow" />
          <div className="lor-audio-card-center">
            <div className={`lor-audio-disc-ring ${mediaInfo.isPlaying ? 'spinning' : ''}`}>
              {mediaInfo.mediaType === 'audio' ? <Music size={28} /> : <Disc size={28} />}
            </div>
            <div className="lor-audio-meta">
              <span className="lor-audio-title">{mediaInfo.title}</span>
              <span className="lor-audio-domain">{mediaInfo.domain}</span>
            </div>
            {/* Real-time parametric equalizer wave bars */}
            <div className="lor-audio-equalizer-bars">
              {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((h, i) => (
                <div
                  key={i}
                  className={`lor-eq-bar ${mediaInfo.isPlaying ? 'animating' : 'paused'}`}
                  style={{
                    height: `${mediaInfo.isPlaying ? h : 15}%`,
                    animationDelay: `${i * 0.08}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Translucent Controls Overlay */}
      <div className="lor-pip-overlay">
        {/* Top Header Bar */}
        <div className="lor-pip-header">
          {/* Back to Tab Button (Exact Arc Match) */}
          <button
            type="button"
            className="lor-pip-pill-btn back-btn"
            onClick={handleBackToTab}
            title="Return to origin tab in Lor Browser"
          >
            <ArrowUpLeft size={14} strokeWidth={2.4} />
            <span>Back to Tab</span>
          </button>

          {/* Domain & Minimize Header */}
          <div className="lor-pip-domain-tag">
            <span>{mediaInfo.domain || 'Playing Media'}</span>
            <span className="lor-pip-divider">—</span>
            <span className="lor-pip-minimize-label">Minimize</span>
          </div>

          {/* Close PiP Button */}
          <button
            type="button"
            className="lor-pip-pill-btn close-btn"
            onClick={handleClose}
            title="Close Picture in Picture"
          >
            <X size={14} strokeWidth={2.4} />
            <span>Close</span>
          </button>
        </div>

        {/* Center Transport Controls (Rewind 15s | Play/Pause | Forward 15s) */}
        <div className="lor-pip-center-controls">
          {/* Rewind 15s */}
          <button
            type="button"
            className="lor-pip-seek-btn"
            onClick={() => handleJump(-15)}
            title="Rewind 15 seconds"
          >
            <div className="lor-pip-seek-icon">
              <RotateCcw size={32} strokeWidth={1.8} />
              <span className="lor-pip-seek-number">15</span>
            </div>
          </button>

          {/* Big Center Play / Pause */}
          <button
            type="button"
            className="lor-pip-play-pause-btn"
            onClick={handleTogglePlay}
            title={mediaInfo.isPlaying ? 'Pause' : 'Play'}
          >
            {mediaInfo.isPlaying ? (
              <div className="lor-pip-pause-bars">
                <span className="bar" />
                <span className="bar" />
              </div>
            ) : (
              <Play size={36} fill="#000000" stroke="#000000" className="play-triangle" />
            )}
          </button>

          {/* Fast Forward 15s */}
          <button
            type="button"
            className="lor-pip-seek-btn"
            onClick={() => handleJump(15)}
            title="Fast forward 15 seconds"
          >
            <div className="lor-pip-seek-icon">
              <RotateCw size={32} strokeWidth={1.8} />
              <span className="lor-pip-seek-number">15</span>
            </div>
          </button>
        </div>

        {/* Bottom Time & Timeline Scrubber */}
        <div className="lor-pip-bottom-bar">
          <div className="lor-pip-scrubber-track" onClick={handleScrub}>
            <div className="lor-pip-scrubber-buffered" />
            <div
              className="lor-pip-scrubber-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="lor-pip-timestamps">
            <span>{formatTime(mediaInfo.currentTime)}</span>
            <span>{formatTime(mediaInfo.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
