'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  RemoteParticipant,
  LocalTrackPublication,
} from 'livekit-client';
import {
  SOPREMISH_USER_ID,
  GRAPE_USER_ID,
  AUTHORIZED_USERS,
  WORLD_ID,
} from '@/lib/appwrite';

interface LiveKitVideoChatProps {
  currentUserId: string;
  onScreenVideoElementChange?: (el: HTMLVideoElement | null) => void;
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export default function LiveKitVideoChat({
  currentUserId,
  onScreenVideoElementChange,
}: LiveKitVideoChatProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Audio / Video toggles
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);
  const [isCamEnabled, setIsCamEnabled] = useState<boolean>(true);

  // Peer states
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState<boolean>(false);
  const [remoteParticipantName, setRemoteParticipantName] = useState<string>('Partner');
  const [isRemoteCamActive, setIsRemoteCamActive] = useState<boolean>(false);
  const [isRemoteMicActive, setIsRemoteMicActive] = useState<boolean>(false);

  // Screen Sharing states
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isStartingScreenShare, setIsStartingScreenShare] = useState<boolean>(false);
  const [hasLocalScreenAudio, setHasLocalScreenAudio] = useState<boolean>(false);
  const [isRemoteScreenActive, setIsRemoteScreenActive] = useState<boolean>(false);
  const [remoteScreenSharerName, setRemoteScreenSharerName] = useState<string>('Partner');
  const [hasRemoteScreenAudio, setHasRemoteScreenAudio] = useState<boolean>(false);
  const [isScreenViewerOpen, setIsScreenViewerOpen] = useState<boolean>(false);
  const [isScreenViewerMaximized, setIsScreenViewerMaximized] = useState<boolean>(false);
  const [isRemoteScreenLoading, setIsRemoteScreenLoading] = useState<boolean>(false);

  // DOM Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Screen Share Video & Audio Refs
  const localScreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenAudioRef = useRef<HTMLAudioElement | null>(null);

  const roomRef = useRef<Room | null>(null);

  // Participant names
  const localProfile = AUTHORIZED_USERS[currentUserId] || AUTHORIZED_USERS[SOPREMISH_USER_ID];
  const otherUserId = currentUserId === SOPREMISH_USER_ID ? GRAPE_USER_ID : SOPREMISH_USER_ID;
  const otherProfile = AUTHORIZED_USERS[otherUserId] || AUTHORIZED_USERS[GRAPE_USER_ID];

  // Inform parent when screen video element is mounted/changed
  useEffect(() => {
    if (!onScreenVideoElementChange) return;
    if (isRemoteScreenActive && remoteScreenVideoRef.current) {
      onScreenVideoElementChange(remoteScreenVideoRef.current);
    } else if (isScreenSharing && localScreenVideoRef.current) {
      onScreenVideoElementChange(localScreenVideoRef.current);
    } else {
      onScreenVideoElementChange(null);
    }
  }, [isRemoteScreenActive, isScreenSharing, onScreenVideoElementChange]);

  // Helper to cleanly detach all tracks
  const detachAllTracks = useCallback(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (localScreenVideoRef.current) localScreenVideoRef.current.srcObject = null;
    if (remoteScreenVideoRef.current) remoteScreenVideoRef.current.srcObject = null;
    if (remoteScreenAudioRef.current) remoteScreenAudioRef.current.srcObject = null;
    if (onScreenVideoElementChange) onScreenVideoElementChange(null);
  }, [onScreenVideoElementChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      detachAllTracks();
    };
  }, [detachAllTracks]);

  // Join Call handler
  const handleJoinCall = async () => {
    setCallStatus('connecting');
    setErrorMessage(null);
    setWarningMessage(null);
    setIsOpen(true);
    setIsMinimized(false);

    try {
      // 1. Fetch server-generated secure token
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: WORLD_ID }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate with video service');
      }

      const { token, url } = data;
      if (!token || !url) {
        throw new Error('Incomplete video configuration received from server');
      }

      // 2. Initialize LiveKit Room instance
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h360.resolution,
        },
      });
      roomRef.current = room;

      // 3. Register Event Listeners
      room.on(RoomEvent.Connected, () => {
        setCallStatus('connected');
        // Check if remote participants are already in the room
        if (room.remoteParticipants.size > 0) {
          setHasRemoteParticipant(true);
          const firstRemote = Array.from(room.remoteParticipants.values())[0];
          setRemoteParticipantName(firstRemote.name || otherProfile.name);

          // Check if remote participant is already sharing a screen
          const screenPub = firstRemote.getTrackPublication(Track.Source.ScreenShare);
          if (screenPub?.isSubscribed && screenPub.track) {
            setRemoteScreenSharerName(firstRemote.name || otherProfile.name);
            setIsRemoteScreenActive(true);
            setIsScreenViewerOpen(true);
            setIsRemoteScreenLoading(true);
            if (remoteScreenVideoRef.current && screenPub.track.kind === Track.Kind.Video) {
              screenPub.track.attach(remoteScreenVideoRef.current);
            }
          }
          const screenAudioPub = firstRemote.getTrackPublication(Track.Source.ScreenShareAudio);
          if (screenAudioPub?.isSubscribed && screenAudioPub.track) {
            setHasRemoteScreenAudio(true);
            if (remoteScreenAudioRef.current && screenAudioPub.track.kind === Track.Kind.Audio) {
              screenAudioPub.track.attach(remoteScreenAudioRef.current);
            }
          }
        }
      });

      room.on(RoomEvent.Reconnecting, () => {
        setCallStatus('reconnecting');
      });

      room.on(RoomEvent.Reconnected, () => {
        setCallStatus('connected');
      });

      room.on(RoomEvent.Disconnected, () => {
        setCallStatus('idle');
        setHasRemoteParticipant(false);
        setIsScreenSharing(false);
        setIsRemoteScreenActive(false);
        setIsScreenViewerOpen(false);
        detachAllTracks();
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        setHasRemoteParticipant(true);
        setRemoteParticipantName(participant.name || otherProfile.name);
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        if (room.remoteParticipants.size === 0) {
          setHasRemoteParticipant(false);
          setIsRemoteCamActive(false);
          setIsRemoteMicActive(false);
          setIsRemoteScreenActive(false);
          setHasRemoteScreenAudio(false);
          setIsScreenViewerOpen(false);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
          if (remoteScreenVideoRef.current) remoteScreenVideoRef.current.srcObject = null;
          if (remoteScreenAudioRef.current) remoteScreenAudioRef.current.srcObject = null;
          if (onScreenVideoElementChange) onScreenVideoElementChange(null);
        }
      });

      // Handle incoming remote media tracks (Differentiating ScreenShare from Webcam/Mic)
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (publication.source === Track.Source.ScreenShare && track.kind === Track.Kind.Video) {
          // Dedicated screen-sharing video feed
          setRemoteScreenSharerName(participant.name || otherProfile.name);
          setIsRemoteScreenActive(true);
          setIsScreenViewerOpen(true);
          setIsRemoteScreenLoading(true);
          if (remoteScreenVideoRef.current) {
            track.attach(remoteScreenVideoRef.current);
          }
        } else if (
          publication.source === Track.Source.ScreenShareAudio &&
          track.kind === Track.Kind.Audio
        ) {
          // Dedicated screen-sharing audio feed
          setHasRemoteScreenAudio(true);
          if (remoteScreenAudioRef.current) {
            track.attach(remoteScreenAudioRef.current);
          }
        } else if (
          publication.source === Track.Source.Camera &&
          track.kind === Track.Kind.Video &&
          remoteVideoRef.current
        ) {
          // Regular webcam feed
          track.attach(remoteVideoRef.current);
          setIsRemoteCamActive(true);
        } else if (
          publication.source === Track.Source.Microphone &&
          track.kind === Track.Kind.Audio &&
          remoteAudioRef.current
        ) {
          // Regular microphone feed
          track.attach(remoteAudioRef.current);
          setIsRemoteMicActive(true);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication) => {
        track.detach();
        if (publication.source === Track.Source.ScreenShare) {
          setIsRemoteScreenActive(false);
          setIsRemoteScreenLoading(false);
          if (remoteScreenVideoRef.current) remoteScreenVideoRef.current.srcObject = null;
          if (!isScreenSharing) {
            setIsScreenViewerOpen(false);
            if (onScreenVideoElementChange) onScreenVideoElementChange(null);
          }
        } else if (publication.source === Track.Source.ScreenShareAudio) {
          setHasRemoteScreenAudio(false);
          if (remoteScreenAudioRef.current) remoteScreenAudioRef.current.srcObject = null;
        } else if (publication.source === Track.Source.Camera) {
          setIsRemoteCamActive(false);
        } else if (publication.source === Track.Source.Microphone) {
          setIsRemoteMicActive(false);
        }
      });

      room.on(RoomEvent.TrackMuted, (publication) => {
        if (publication.source === Track.Source.Camera) {
          setIsRemoteCamActive(false);
        }
      });

      room.on(RoomEvent.TrackUnmuted, (publication) => {
        if (publication.source === Track.Source.Camera) {
          setIsRemoteCamActive(true);
        }
      });

      // Handle local tracks publication & native browser stop-sharing detection
      room.on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
        if (
          publication.source === Track.Source.Camera &&
          publication.track?.kind === Track.Kind.Video &&
          localVideoRef.current
        ) {
          publication.track.attach(localVideoRef.current);
        } else if (
          publication.source === Track.Source.ScreenShare &&
          publication.track?.kind === Track.Kind.Video
        ) {
          setIsScreenSharing(true);
          setIsScreenViewerOpen(true);
          if (localScreenVideoRef.current) {
            publication.track.attach(localScreenVideoRef.current);
          }
          // Secondary event hook on native media stream track 'ended'
          publication.track.mediaStreamTrack.addEventListener('ended', () => {
            setIsScreenSharing(false);
            setHasLocalScreenAudio(false);
            if (localScreenVideoRef.current) localScreenVideoRef.current.srcObject = null;
            if (!isRemoteScreenActive) setIsScreenViewerOpen(false);
          });
        } else if (publication.source === Track.Source.ScreenShareAudio) {
          setHasLocalScreenAudio(true);
        }
      });

      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.source === Track.Source.ScreenShare) {
          setIsScreenSharing(false);
          setHasLocalScreenAudio(false);
          if (localScreenVideoRef.current) localScreenVideoRef.current.srcObject = null;
          if (!isRemoteScreenActive) {
            setIsScreenViewerOpen(false);
            if (onScreenVideoElementChange) onScreenVideoElementChange(null);
          }
        } else if (publication.source === Track.Source.ScreenShareAudio) {
          setHasLocalScreenAudio(false);
        }
      });

      // 4. Connect to LiveKit Server
      await room.connect(url, token);

      // 5. Explicitly request camera and microphone permissions upon joining
      try {
        await room.localParticipant.enableCameraAndMicrophone();
        setIsCamEnabled(true);
        setIsMicEnabled(true);

        // Attach local video track if available
        const videoTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
        if (videoTrack && localVideoRef.current) {
          videoTrack.attach(localVideoRef.current);
        }
      } catch (permErr: any) {
        console.warn('Media permission denied or camera/mic not available:', permErr);
        setWarningMessage('Camera/Microphone access was denied. You are connected in spectator mode.');
        setIsCamEnabled(false);
        setIsMicEnabled(false);
      }
    } catch (err: any) {
      console.error('Failed to join LiveKit call:', err);
      setCallStatus('error');
      setErrorMessage(err?.message || 'Could not connect to video service');
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    }
  };

  // Leave Call handler
  const handleLeaveCall = async () => {
    if (roomRef.current) {
      if (isScreenSharing) {
        try {
          await roomRef.current.localParticipant.setScreenShareEnabled(false);
        } catch {
          // Ignore
        }
      }
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    detachAllTracks();
    setCallStatus('idle');
    setHasRemoteParticipant(false);
    setIsRemoteCamActive(false);
    setIsRemoteMicActive(false);
    setIsScreenSharing(false);
    setHasLocalScreenAudio(false);
    setIsRemoteScreenActive(false);
    setHasRemoteScreenAudio(false);
    setIsScreenViewerOpen(false);
    setIsOpen(false);
    setErrorMessage(null);
    setWarningMessage(null);
  };

  // Toggle Microphone
  const handleToggleMic = async () => {
    if (!roomRef.current || callStatus !== 'connected') return;
    try {
      const nextState = !isMicEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(nextState);
      setIsMicEnabled(nextState);
    } catch (err: any) {
      console.warn('Error toggling microphone:', err);
    }
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    if (!roomRef.current || callStatus !== 'connected') return;
    try {
      const nextState = !isCamEnabled;
      await roomRef.current.localParticipant.setCameraEnabled(nextState);
      setIsCamEnabled(nextState);

      if (nextState) {
        const videoTrack = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
        if (videoTrack && localVideoRef.current) {
          videoTrack.attach(localVideoRef.current);
        }
      }
    } catch (err: any) {
      console.warn('Error toggling camera:', err);
    }
  };

  // Toggle Screen Sharing
  const handleToggleScreenShare = async () => {
    if (!roomRef.current || callStatus !== 'connected' || isStartingScreenShare) return;

    if (isScreenSharing) {
      // Stop screen sharing
      setIsStartingScreenShare(true);
      try {
        await roomRef.current.localParticipant.setScreenShareEnabled(false);
        setIsScreenSharing(false);
        setHasLocalScreenAudio(false);
        if (localScreenVideoRef.current) localScreenVideoRef.current.srcObject = null;
        if (!isRemoteScreenActive) {
          setIsScreenViewerOpen(false);
          if (onScreenVideoElementChange) onScreenVideoElementChange(null);
        }
      } catch (err: any) {
        console.error('Error stopping screen share:', err);
      } finally {
        setIsStartingScreenShare(false);
      }
    } else {
      // Start screen sharing
      setIsStartingScreenShare(true);
      setErrorMessage(null);
      try {
        // Request capture with audio if supported
        await roomRef.current.localParticipant.setScreenShareEnabled(true, {
          audio: true,
          selfBrowserSurface: 'include',
          surfaceSwitching: 'include',
          systemAudio: 'include',
        });

        const videoPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare);
        const audioPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShareAudio);

        if (videoPub?.track) {
          setIsScreenSharing(true);
          setIsScreenViewerOpen(true);
          if (localScreenVideoRef.current) {
            videoPub.track.attach(localScreenVideoRef.current);
          }
        }

        setHasLocalScreenAudio(Boolean(audioPub?.track));
      } catch (err: any) {
        console.warn('Screen share request cancelled or rejected:', err);
        if (
          err?.name === 'NotAllowedError' ||
          err?.message?.toLowerCase().includes('permission') ||
          err?.message?.toLowerCase().includes('cancel')
        ) {
          // User closed the browser source picker dialog; normal cancel, no error banner needed
        } else {
          setErrorMessage(err?.message || 'Unable to start screen capture');
        }
        setIsScreenSharing(false);
        setHasLocalScreenAudio(false);
      } finally {
        setIsStartingScreenShare(false);
      }
    }
  };

  const hasAnyActiveScreen = isRemoteScreenActive || isScreenSharing;
  const activeSharerName = isScreenSharing ? 'You' : remoteScreenSharerName;
  const isAudioSharedActive = isScreenSharing ? hasLocalScreenAudio : hasRemoteScreenAudio;

  return (
    <>
      {/* Hidden Audio element for remote participant microphone */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Hidden Audio element for remote participant screen share audio */}
      <audio ref={remoteScreenAudioRef} autoPlay />

      {/* Top HUD Call Launch / Status Button */}
      <div className="livekit-hud-anchor">
        {callStatus === 'idle' ? (
          <button
            type="button"
            className="livekit-join-pill-btn"
            onClick={handleJoinCall}
            title="Start or join private Living Room video call"
            aria-label="Join Video Call"
          >
            <span className="livekit-pill-icon">📞</span>
            <span className="livekit-pill-text">Join Call</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`livekit-join-pill-btn active ${callStatus === 'connecting' ? 'pulsing' : ''}`}
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              title="Open video call panel"
              aria-label="Open Call Window"
            >
              <span className="livekit-status-dot green" />
              <span className="livekit-pill-text">
                {callStatus === 'connecting'
                  ? 'Connecting...'
                  : hasRemoteParticipant
                  ? `Call: ${otherProfile.name} Connected`
                  : 'Call: In Living Room'}
              </span>
            </button>

            {/* Quick Watch-Together Screen Toggle Button in HUD */}
            {hasAnyActiveScreen && (
              <button
                type="button"
                className={`livekit-tv-pill-btn ${isScreenViewerOpen ? 'active' : ''}`}
                onClick={() => setIsScreenViewerOpen((prev) => !prev)}
                title={isScreenViewerOpen ? 'Hide Screen Viewer' : 'Open Screen Viewer'}
                aria-label="Toggle Screen Viewer"
              >
                <span className="tv-icon">📺</span>
                <span className="tv-text">
                  {isScreenViewerOpen ? 'Hide Screen' : `Watch ${activeSharerName}`}
                </span>
                {isAudioSharedActive && <span className="tv-audio-badge">🔊</span>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* VIRTUAL-TV FLOATING SCREEN SHARE VIEWER (PHASE 4 & 5)      */}
      {/* ========================================================= */}
      {hasAnyActiveScreen && isScreenViewerOpen && (
        <aside
          className={`livekit-screen-viewer ${isScreenViewerMaximized ? 'maximized' : ''}`}
          role="dialog"
          aria-label="Live Screen Share Viewer"
          onClick={(e) => e.stopPropagation()}
        >
          {/* TV Screen Frame Header */}
          <header className="screen-viewer-header">
            <div className="screen-viewer-title-group">
              <span className="livekit-status-dot green pulsing" />
              <span className="screen-viewer-tag">LIVE SCREEN SHARE</span>
              <span className="screen-viewer-sharer">
                {isScreenSharing ? 'You are sharing' : `${remoteScreenSharerName} is sharing`}
              </span>
              <span className={`screen-audio-indicator ${isAudioSharedActive ? 'active' : 'muted'}`}>
                {isAudioSharedActive ? '🔊 Audio Active' : '🔇 Video Only'}
              </span>
            </div>

            <div className="screen-viewer-actions">
              {/* If local user is sharing, quick stop button right in viewer */}
              {isScreenSharing && (
                <button
                  type="button"
                  className="screen-stop-inline-btn"
                  onClick={handleToggleScreenShare}
                  disabled={isStartingScreenShare}
                  title="Stop Sharing Your Screen"
                >
                  ⏹️ Stop Sharing
                </button>
              )}

              {/* Maximize / Restore Toggle */}
              <button
                type="button"
                className="screen-viewer-action-btn"
                onClick={() => setIsScreenViewerMaximized((prev) => !prev)}
                title={isScreenViewerMaximized ? 'Restore Window Size' : 'Theater / Maximize View'}
                aria-label={isScreenViewerMaximized ? 'Restore View' : 'Maximize View'}
              >
                {isScreenViewerMaximized ? '⤡' : '⤢'}
              </button>

              {/* Close / Hide Viewer (doesn't stop stream) */}
              <button
                type="button"
                className="screen-viewer-action-btn"
                onClick={() => setIsScreenViewerOpen(false)}
                title="Hide Viewer (Screen share remains active)"
                aria-label="Hide Screen Viewer"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Screen Share Video Frame */}
          <div className="screen-viewer-body">
            {/* Loading Indicator */}
            {isRemoteScreenLoading && (
              <div className="screen-viewer-loading-overlay">
                <div className="livekit-pixel-spinner" />
                <p>Synchronizing video stream...</p>
              </div>
            )}

            {/* Video Canvas Element */}
            {isScreenSharing ? (
              <video
                ref={localScreenVideoRef}
                autoPlay
                playsInline
                muted
                className="livekit-screen-video"
              />
            ) : (
              <video
                ref={remoteScreenVideoRef}
                autoPlay
                playsInline
                onLoadedData={() => setIsRemoteScreenLoading(false)}
                className="livekit-screen-video"
              />
            )}

            {/* Subtle retro CRT scanline overlay */}
            <div className="screen-viewer-crt-effect" aria-hidden="true" />
          </div>

          {/* Viewer Footer */}
          <footer className="screen-viewer-footer">
            <span className="screen-hint">
              🎮 BERK Living Room TV • {isScreenSharing ? 'Your Shared Display' : `${remoteScreenSharerName}'s Broadcast`}
            </span>
            <div className="screen-footer-actions">
              <span className="screen-badge">
                {isScreenViewerMaximized ? 'Theater Mode' : 'Floating Window'}
              </span>
            </div>
          </footer>
        </aside>
      )}

      {/* ========================================================= */}
      {/* FLOATING VIDEO CALL CONTROLS PANEL                       */}
      {/* ========================================================= */}
      {isOpen && (
        <aside
          className={`livekit-floating-panel ${isMinimized ? 'minimized' : ''}`}
          role="region"
          aria-label="Video Call"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="livekit-panel-header">
            <div className="livekit-panel-title-group">
              <span className={`livekit-status-dot ${callStatus === 'connected' ? 'green' : 'yellow'}`} />
              <span className="livekit-panel-title">LIVING ROOM CALL</span>
              {callStatus === 'connected' && (
                <span className="livekit-participant-count">
                  {hasRemoteParticipant ? '2/2' : '1/2'}
                </span>
              )}
            </div>

            <div className="livekit-panel-actions">
              <button
                type="button"
                className="livekit-panel-icon-btn"
                onClick={() => setIsMinimized((prev) => !prev)}
                title={isMinimized ? 'Expand Call Window' : 'Minimize Call Window'}
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? '▢' : '—'}
              </button>
              <button
                type="button"
                className="livekit-panel-icon-btn danger"
                onClick={handleLeaveCall}
                title="Leave Call"
                aria-label="Leave Call"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Body (only rendered if not minimized) */}
          {!isMinimized && (
            <div className="livekit-panel-body">
              {/* Warnings / Error banner */}
              {errorMessage && (
                <div className="livekit-alert danger" role="alert">
                  <span className="alert-text">{errorMessage}</span>
                  <button
                    type="button"
                    className="alert-btn"
                    onClick={() => setErrorMessage(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {warningMessage && (
                <div className="livekit-alert warning" role="alert">
                  <span className="alert-text">{warningMessage}</span>
                  <button
                    type="button"
                    className="alert-btn"
                    onClick={() => setWarningMessage(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {callStatus === 'connecting' && (
                <div className="livekit-connecting-state">
                  <div className="livekit-pixel-spinner" />
                  <p>Joining Living Room video call...</p>
                  <span className="livekit-subtext">Connecting to LiveKit real-time room</span>
                </div>
              )}

              {callStatus !== 'connecting' && (
                <div className="livekit-streams-grid">
                  {/* Local Video Tile */}
                  <div className="livekit-stream-tile local">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`livekit-video-element mirrored ${!isCamEnabled ? 'hidden' : ''}`}
                    />
                    {!isCamEnabled && (
                      <div className="livekit-camera-off-placeholder">
                        <div className="avatar-circle">
                          {localProfile.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="placeholder-text">Camera Off</span>
                      </div>
                    )}
                    <div className="livekit-tile-badge">
                      <span className="badge-name">You ({localProfile.name})</span>
                      <span className="badge-icons">
                        {!isMicEnabled && <span title="Mic Muted">🔇</span>}
                        {!isCamEnabled && <span title="Camera Off">📷</span>}
                        {isScreenSharing && <span title="Sharing Screen">🖥️</span>}
                      </span>
                    </div>
                  </div>

                  {/* Remote Video Tile */}
                  <div className="livekit-stream-tile remote">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className={`livekit-video-element ${!isRemoteCamActive || !hasRemoteParticipant ? 'hidden' : ''}`}
                    />
                    {hasRemoteParticipant && !isRemoteCamActive && (
                      <div className="livekit-camera-off-placeholder">
                        <div className="avatar-circle remote">
                          {otherProfile.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="placeholder-text">{otherProfile.name} (Camera Off)</span>
                      </div>
                    )}
                    {!hasRemoteParticipant && (
                      <div className="livekit-waiting-placeholder">
                        <div className="waiting-pulse" />
                        <span className="waiting-text">Waiting for {otherProfile.name}...</span>
                        <span className="waiting-subtext">They will appear here when they join</span>
                      </div>
                    )}
                    <div className="livekit-tile-badge">
                      <span className="badge-name">{hasRemoteParticipant ? remoteParticipantName : otherProfile.name}</span>
                      {hasRemoteParticipant && (
                        <span className="badge-icons">
                          {!isRemoteMicActive && <span title="Remote Mic Inactive">🔇</span>}
                          {isRemoteScreenActive && <span title="Sharing Screen">🖥️</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Controls Footer */}
              <footer className="livekit-controls-footer">
                {/* Microphone Toggle */}
                <button
                  type="button"
                  className={`livekit-control-btn ${!isMicEnabled ? 'muted' : ''}`}
                  onClick={handleToggleMic}
                  disabled={callStatus !== 'connected'}
                  title={isMicEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                  aria-label={isMicEnabled ? 'Mute Mic' : 'Unmute Mic'}
                >
                  <span className="btn-icon">{isMicEnabled ? '🎤' : '🔇'}</span>
                  <span className="btn-label">{isMicEnabled ? 'Mute' : 'Unmuted'}</span>
                </button>

                {/* Camera Toggle */}
                <button
                  type="button"
                  className={`livekit-control-btn ${!isCamEnabled ? 'muted' : ''}`}
                  onClick={handleToggleCamera}
                  disabled={callStatus !== 'connected'}
                  title={isCamEnabled ? 'Stop Video Camera' : 'Start Video Camera'}
                  aria-label={isCamEnabled ? 'Stop Video' : 'Start Video'}
                >
                  <span className="btn-icon">{isCamEnabled ? '📹' : '📷'}</span>
                  <span className="btn-label">{isCamEnabled ? 'Cam On' : 'Cam Off'}</span>
                </button>

                {/* Screen Share Toggle Button (Phase 2 & 3) */}
                <button
                  type="button"
                  className={`livekit-control-btn screen-share ${isScreenSharing ? 'active-share' : ''}`}
                  onClick={handleToggleScreenShare}
                  disabled={callStatus !== 'connected' || isStartingScreenShare}
                  title={
                    isScreenSharing
                      ? 'Stop Sharing Screen'
                      : 'Share Screen, Window, or Browser Tab'
                  }
                  aria-label={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <span className="btn-icon">
                    {isStartingScreenShare ? '⏳' : isScreenSharing ? '⏹️' : '🖥️'}
                  </span>
                  <span className="btn-label">
                    {isStartingScreenShare
                      ? 'Starting...'
                      : isScreenSharing
                      ? 'Stop Share'
                      : 'Share Screen'}
                  </span>
                </button>

                {/* Leave Call Button */}
                <button
                  type="button"
                  className="livekit-control-btn leave"
                  onClick={handleLeaveCall}
                  title="Leave Call"
                  aria-label="Leave Call"
                >
                  <span className="btn-icon">📞</span>
                  <span className="btn-label">Leave</span>
                </button>
              </footer>
            </div>
          )}

          {/* Minimized Quick Bar */}
          {isMinimized && (
            <div className="livekit-minimized-bar">
              <span className="minimized-label">
                {hasRemoteParticipant ? `${otherProfile.name} connected` : 'Living Room Call'}
              </span>
              <button
                type="button"
                className={`minimized-btn ${!isMicEnabled ? 'muted' : ''}`}
                onClick={handleToggleMic}
                title={isMicEnabled ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isMicEnabled ? '🎤' : '🔇'}
              </button>
              <button
                type="button"
                className={`minimized-btn ${!isCamEnabled ? 'muted' : ''}`}
                onClick={handleToggleCamera}
                title={isCamEnabled ? 'Turn Off Cam' : 'Turn On Cam'}
              >
                {isCamEnabled ? '📹' : '📷'}
              </button>
              <button
                type="button"
                className={`minimized-btn ${isScreenSharing ? 'active-share' : ''}`}
                onClick={handleToggleScreenShare}
                disabled={isStartingScreenShare}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                {isScreenSharing ? '⏹️' : '🖥️'}
              </button>
              <button
                type="button"
                className="minimized-btn leave"
                onClick={handleLeaveCall}
                title="Leave Call"
              >
                ✕
              </button>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
