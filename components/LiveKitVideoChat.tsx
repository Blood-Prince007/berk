'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  RemoteTrackPublication,
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
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export default function LiveKitVideoChat({ currentUserId }: LiveKitVideoChatProps) {
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

  // DOM Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const roomRef = useRef<Room | null>(null);

  // Participant names
  const localProfile = AUTHORIZED_USERS[currentUserId] || AUTHORIZED_USERS[SOPREMISH_USER_ID];
  const otherUserId = currentUserId === SOPREMISH_USER_ID ? GRAPE_USER_ID : SOPREMISH_USER_ID;
  const otherProfile = AUTHORIZED_USERS[otherUserId] || AUTHORIZED_USERS[GRAPE_USER_ID];

  // Helper to cleanly detach all tracks
  const detachAllTracks = useCallback(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

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
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
        }
      });

      // Handle incoming remote media tracks
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
          track.attach(remoteVideoRef.current);
          setIsRemoteCamActive(true);
        } else if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
          track.attach(remoteAudioRef.current);
          setIsRemoteMicActive(true);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
        if (track.kind === Track.Kind.Video) {
          setIsRemoteCamActive(false);
        } else if (track.kind === Track.Kind.Audio) {
          setIsRemoteMicActive(false);
        }
      });

      room.on(RoomEvent.TrackMuted, (publication) => {
        if (publication.kind === Track.Kind.Video) {
          setIsRemoteCamActive(false);
        }
      });

      room.on(RoomEvent.TrackUnmuted, (publication) => {
        if (publication.kind === Track.Kind.Video) {
          setIsRemoteCamActive(true);
        }
      });

      // Handle local tracks
      room.on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
        if (publication.track?.kind === Track.Kind.Video && localVideoRef.current) {
          publication.track.attach(localVideoRef.current);
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
  const handleLeaveCall = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    detachAllTracks();
    setCallStatus('idle');
    setHasRemoteParticipant(false);
    setIsRemoteCamActive(false);
    setIsRemoteMicActive(false);
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

  return (
    <>
      {/* Hidden Audio element for remote participant */}
      <audio ref={remoteAudioRef} autoPlay />

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
        )}
      </div>

      {/* Floating Video Chat Window */}
      {isOpen && (
        <aside
          className={`livekit-floating-panel ${isMinimized ? 'minimized' : ''}`}
          role="region"
          aria-label="Video Call"
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
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Controls Footer */}
              <footer className="livekit-controls-footer">
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
