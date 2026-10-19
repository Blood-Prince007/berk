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
  onScreenVideoElementChange?: (el: HTMLVideoElement | null) => void;
  onRemoteParticipantChange?: (hasRemote: boolean) => void;
  onPositionDataReceived?: (data: any) => void;
  onSendPositionDataReady?: (sender: ((posData: any) => void) | null) => void;
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export default function LiveKitVideoChat({
  currentUserId,
  onScreenVideoElementChange,
  onRemoteParticipantChange,
  onPositionDataReceived,
  onSendPositionDataReady,
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
  const [isScreenViewerMinimized, setIsScreenViewerMinimized] = useState<boolean>(false);
  const [isScreenViewerMaximized, setIsScreenViewerMaximized] = useState<boolean>(false);
  const [isRemoteScreenLoading, setIsRemoteScreenLoading] = useState<boolean>(false);

  // Reactive Track States (fixes track attachment timing and dynamic element mounting)
  const [remoteScreenTrack, setRemoteScreenTrack] = useState<Track | null>(null);
  const [localScreenTrack, setLocalScreenTrack] = useState<Track | null>(null);
  const [remoteScreenAudioTrack, setRemoteScreenAudioTrack] = useState<Track | null>(null);
  const [remoteCamTrack, setRemoteCamTrack] = useState<Track | null>(null);
  const [remoteMicTrack, setRemoteMicTrack] = useState<Track | null>(null);
  const [localCamTrack, setLocalCamTrack] = useState<Track | null>(null);

  // DOM Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Screen Share Video & Audio Refs
  const localScreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenAudioRef = useRef<HTMLAudioElement | null>(null);

  // Avoid stale closures in event listener callbacks
  const isScreenSharingRef = useRef<boolean>(false);
  const isRemoteScreenActiveRef = useRef<boolean>(false);

  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  useEffect(() => {
    isRemoteScreenActiveRef.current = isRemoteScreenActive;
  }, [isRemoteScreenActive]);

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
  }, [
    isRemoteScreenActive,
    isScreenSharing,
    remoteScreenTrack,
    localScreenTrack,
    onScreenVideoElementChange,
  ]);

  // Cleanly detach ONLY remote tracks (called on peer disconnect / refresh so local tracks remain untouched)
  const detachRemoteTracks = useCallback(() => {
    setRemoteScreenTrack(null);
    setRemoteScreenAudioTrack(null);
    setRemoteCamTrack(null);
    setRemoteMicTrack(null);
    setIsRemoteCamActive(false);
    setIsRemoteMicActive(false);
    setIsRemoteScreenActive(false);
    setHasRemoteScreenAudio(false);
    setIsRemoteScreenLoading(false);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (remoteScreenVideoRef.current) remoteScreenVideoRef.current.srcObject = null;
    if (remoteScreenAudioRef.current) remoteScreenAudioRef.current.srcObject = null;
    if (!isScreenSharingRef.current && onScreenVideoElementChange) {
      onScreenVideoElementChange(null);
    }
  }, [onScreenVideoElementChange]);

  // Helper to cleanly detach all tracks (local + remote) on full leave or unmount
  const detachAllTracks = useCallback(() => {
    detachRemoteTracks();
    setLocalScreenTrack(null);
    setLocalCamTrack(null);
    setIsScreenSharing(false);
    setHasLocalScreenAudio(false);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (localScreenVideoRef.current) localScreenVideoRef.current.srcObject = null;
    if (onScreenVideoElementChange) onScreenVideoElementChange(null);
  }, [detachRemoteTracks, onScreenVideoElementChange]);

  // Reactive effect: attach remote screen video whenever track or viewer element mounts
  useEffect(() => {
    const el = remoteScreenVideoRef.current;
    if (el && remoteScreenTrack) {
      remoteScreenTrack.attach(el);
      el.play().catch(() => {});
      const clearLoading = () => setIsRemoteScreenLoading(false);
      el.addEventListener('loadeddata', clearLoading);
      el.addEventListener('playing', clearLoading);
      el.addEventListener('canplay', clearLoading);
      if (el.readyState >= 2) {
        setIsRemoteScreenLoading(false);
      }
      return () => {
        el.removeEventListener('loadeddata', clearLoading);
        el.removeEventListener('playing', clearLoading);
        el.removeEventListener('canplay', clearLoading);
      };
    }
  }, [remoteScreenTrack, isScreenViewerOpen, isScreenViewerMinimized, isScreenViewerMaximized]);

  // Timeout guard for screen loading spinner
  useEffect(() => {
    if (remoteScreenTrack) {
      const timer = setTimeout(() => {
        setIsRemoteScreenLoading(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [remoteScreenTrack]);

  // Reactive effect: attach local screen preview whenever track or viewer element mounts
  useEffect(() => {
    const el = localScreenVideoRef.current;
    if (el && localScreenTrack) {
      localScreenTrack.attach(el);
      el.play().catch(() => {});
    }
  }, [localScreenTrack, isScreenViewerOpen, isScreenViewerMinimized, isScreenViewerMaximized]);

  // Reactive effect: attach remote screen audio
  useEffect(() => {
    const el = remoteScreenAudioRef.current;
    if (el && remoteScreenAudioTrack) {
      remoteScreenAudioTrack.attach(el);
      el.play().catch(() => {});
    }
  }, [remoteScreenAudioTrack]);

  // Reactive effect: attach remote webcam
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (el && remoteCamTrack) {
      remoteCamTrack.attach(el);
      el.play().catch(() => {});
    }
  }, [remoteCamTrack, isMinimized, isOpen]);

  // Reactive effect: attach remote microphone
  useEffect(() => {
    const el = remoteAudioRef.current;
    if (el && remoteMicTrack) {
      remoteMicTrack.attach(el);
      el.play().catch(() => {});
    }
  }, [remoteMicTrack]);

  // Reactive effect: attach local webcam
  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localCamTrack) {
      localCamTrack.attach(el);
      el.play().catch(() => {});
    }
  }, [localCamTrack, isMinimized, isOpen]);

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

  // Join Call handler (supports standalone TV screen-share or webcam/mic call)
  const handleJoinCall = async ({
    enableCamMic = true,
    openCallPanel = true,
  }: {
    enableCamMic?: boolean;
    openCallPanel?: boolean;
  } = {}): Promise<Room | null> => {
    // If room is already active in background, quickly open panel or enable cam/mic
    if (roomRef.current && roomRef.current.state === 'connected') {
      if (openCallPanel) {
        setIsOpen(true);
        setIsMinimized(false);
      }
      if (enableCamMic) {
        try {
          await roomRef.current.localParticipant.enableCameraAndMicrophone();
          setIsCamEnabled(true);
          setIsMicEnabled(true);
          const camPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.track) {
            setLocalCamTrack(camPub.track);
          }
        } catch (permErr: any) {
          console.warn('Media permission denied or camera/mic not available:', permErr);
          setWarningMessage(
            'Camera/Microphone access was denied. You are connected in spectator mode.'
          );
          setIsCamEnabled(false);
          setIsMicEnabled(false);
        }
      }
      return roomRef.current;
    }

    setCallStatus('connecting');
    setErrorMessage(null);
    setWarningMessage(null);
    if (openCallPanel) {
      setIsOpen(true);
      setIsMinimized(false);
    }

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
        let hasRemote = false;
        for (const p of Array.from(room.remoteParticipants.values())) {
          hasRemote = true;
          setRemoteParticipantName(p.name || otherProfile.name);

          // Check if remote participant is already sharing a screen
          for (const pub of Array.from(p.trackPublications.values())) {
            if (pub.source === Track.Source.ScreenShare) {
              setRemoteScreenSharerName(p.name || otherProfile.name);
              setIsRemoteScreenActive(true);
              setIsScreenViewerOpen(true);
              if (pub.isSubscribed && pub.track) {
                setRemoteScreenTrack(pub.track);
              }
            } else if (pub.source === Track.Source.ScreenShareAudio) {
              setHasRemoteScreenAudio(true);
              if (pub.isSubscribed && pub.track) {
                setRemoteScreenAudioTrack(pub.track);
              }
            } else if (pub.source === Track.Source.Camera) {
              if (pub.isSubscribed && pub.track) {
                setRemoteCamTrack(pub.track);
                setIsRemoteCamActive(true);
              }
            } else if (pub.source === Track.Source.Microphone) {
              if (pub.isSubscribed && pub.track) {
                setRemoteMicTrack(pub.track);
                setIsRemoteMicActive(true);
              }
            }
          }
        }
        setHasRemoteParticipant(hasRemote);
        onRemoteParticipantChange?.(hasRemote);

        // Expose real-time position data sender
        if (onSendPositionDataReady) {
          onSendPositionDataReady((posData: any) => {
            if (roomRef.current && roomRef.current.state === 'connected') {
              try {
                const bytes = new TextEncoder().encode(
                  JSON.stringify({ type: 'player_move', ...posData })
                );
                roomRef.current.localParticipant.publishData(bytes, { reliable: false });
              } catch {}
            }
          });
        }
      });

      // Receive real-time position packets from other player
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const text = new TextDecoder().decode(payload);
          const parsed = JSON.parse(text);
          if (parsed?.type === 'player_move' && onPositionDataReceived) {
            onPositionDataReceived(parsed);
          }
        } catch {}
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
        onRemoteParticipantChange?.(false);
        onSendPositionDataReady?.(null);
        setIsScreenSharing(false);
        setIsRemoteScreenActive(false);
        setIsScreenViewerOpen(false);
        detachAllTracks();
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        setHasRemoteParticipant(true);
        onRemoteParticipantChange?.(true);
        setRemoteParticipantName(participant.name || otherProfile.name);
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        const hasRemote = room.remoteParticipants.size > 0;
        setHasRemoteParticipant(hasRemote);
        onRemoteParticipantChange?.(hasRemote);
        // Detach ONLY remote tracks so local user's screen share and camera are NOT affected!
        detachRemoteTracks();
        if (!isScreenSharingRef.current) {
          setIsRemoteScreenActive(false);
          setHasRemoteScreenAudio(false);
          setIsRemoteScreenLoading(false);
        }
      });

      // REALTIME: Detect when a track is published immediately (instant window open)
      room.on(
        RoomEvent.TrackPublished,
        (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (publication.source === Track.Source.ScreenShare) {
            setRemoteScreenSharerName(participant.name || otherProfile.name);
            setIsRemoteScreenActive(true);
            setIsScreenViewerOpen(true);
            setIsScreenViewerMinimized(false);
            setIsRemoteScreenLoading(true);
          } else if (publication.source === Track.Source.ScreenShareAudio) {
            setHasRemoteScreenAudio(true);
          }
        }
      );

      // REALTIME: Detect when a track is unpublished immediately (instant window close)
      room.on(RoomEvent.TrackUnpublished, (publication: RemoteTrackPublication) => {
        if (publication.source === Track.Source.ScreenShare) {
          setIsRemoteScreenActive(false);
          setRemoteScreenTrack(null);
          setIsRemoteScreenLoading(false);
          if (remoteScreenVideoRef.current) {
            remoteScreenVideoRef.current.srcObject = null;
          }
          if (!isScreenSharingRef.current && onScreenVideoElementChange) {
            onScreenVideoElementChange(null);
          }
        } else if (publication.source === Track.Source.ScreenShareAudio) {
          setHasRemoteScreenAudio(false);
          setRemoteScreenAudioTrack(null);
        }
      });

      // Handle incoming remote media tracks (Differentiating ScreenShare from Webcam/Mic)
      room.on(
        RoomEvent.TrackSubscribed,
        (track: Track, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (publication.source === Track.Source.ScreenShare && track.kind === Track.Kind.Video) {
            setRemoteScreenSharerName(participant.name || otherProfile.name);
            setIsRemoteScreenActive(true);
            setIsScreenViewerOpen(true);
            setIsScreenViewerMinimized(false);
            setRemoteScreenTrack(track);
          } else if (
            publication.source === Track.Source.ScreenShareAudio &&
            track.kind === Track.Kind.Audio
          ) {
            setHasRemoteScreenAudio(true);
            setRemoteScreenAudioTrack(track);
          } else if (
            publication.source === Track.Source.Camera &&
            track.kind === Track.Kind.Video
          ) {
            setRemoteCamTrack(track);
            setIsRemoteCamActive(true);
          } else if (
            publication.source === Track.Source.Microphone &&
            track.kind === Track.Kind.Audio
          ) {
            setRemoteMicTrack(track);
            setIsRemoteMicActive(true);
          }
        }
      );

      room.on(
        RoomEvent.TrackUnsubscribed,
        (track: Track, publication: RemoteTrackPublication) => {
          try {
            track.detach();
          } catch {}
          if (publication.source === Track.Source.ScreenShare) {
            setIsRemoteScreenActive(false);
            setRemoteScreenTrack(null);
            setIsRemoteScreenLoading(false);
            if (remoteScreenVideoRef.current) {
              remoteScreenVideoRef.current.srcObject = null;
            }
            if (!isScreenSharingRef.current && onScreenVideoElementChange) {
              onScreenVideoElementChange(null);
            }
          } else if (publication.source === Track.Source.ScreenShareAudio) {
            setHasRemoteScreenAudio(false);
            setRemoteScreenAudioTrack(null);
          } else if (publication.source === Track.Source.Camera) {
            setRemoteCamTrack(null);
            setIsRemoteCamActive(false);
          } else if (publication.source === Track.Source.Microphone) {
            setRemoteMicTrack(null);
            setIsRemoteMicActive(false);
          }
        }
      );

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
          publication.track?.kind === Track.Kind.Video
        ) {
          setLocalCamTrack(publication.track);
        } else if (
          publication.source === Track.Source.ScreenShare &&
          publication.track?.kind === Track.Kind.Video
        ) {
          setIsScreenSharing(true);
          setIsScreenViewerOpen(true);
          setIsScreenViewerMinimized(false);
          setLocalScreenTrack(publication.track);

          // Secondary event hook on native media stream track 'ended'
          publication.track.mediaStreamTrack.addEventListener('ended', () => {
            setIsScreenSharing(false);
            setLocalScreenTrack(null);
            setHasLocalScreenAudio(false);
            if (!isRemoteScreenActiveRef.current && onScreenVideoElementChange) {
              onScreenVideoElementChange(null);
            }
          });
        } else if (publication.source === Track.Source.ScreenShareAudio) {
          setHasLocalScreenAudio(true);
        }
      });

      room.on(RoomEvent.LocalTrackUnpublished, (publication: LocalTrackPublication) => {
        if (publication.source === Track.Source.ScreenShare) {
          setIsScreenSharing(false);
          setLocalScreenTrack(null);
          setHasLocalScreenAudio(false);
          if (!isRemoteScreenActiveRef.current && onScreenVideoElementChange) {
            onScreenVideoElementChange(null);
          }
        } else if (publication.source === Track.Source.ScreenShareAudio) {
          setHasLocalScreenAudio(false);
        } else if (publication.source === Track.Source.Camera) {
          setLocalCamTrack(null);
        }
      });

      // 4. Connect to LiveKit Server
      await room.connect(url, token);

      // 5. Optionally request camera and microphone permissions upon joining
      if (enableCamMic) {
        try {
          await room.localParticipant.enableCameraAndMicrophone();
          setIsCamEnabled(true);
          setIsMicEnabled(true);

          const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.track) {
            setLocalCamTrack(camPub.track);
          }
        } catch (permErr: any) {
          console.warn('Media permission denied or camera/mic not available:', permErr);
          setWarningMessage(
            'Camera/Microphone access was denied. You are connected in spectator mode.'
          );
          setIsCamEnabled(false);
          setIsMicEnabled(false);
        }
      } else {
        setIsCamEnabled(false);
        setIsMicEnabled(false);
      }

      return room;
    } catch (err: any) {
      console.error('Failed to join LiveKit call:', err);
      setCallStatus('error');
      setErrorMessage(err?.message || 'Could not connect to video service');
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      return null;
    }
  };

  // Auto-connect room in background for instant peer presence & data sync
  useEffect(() => {
    if (currentUserId && callStatus === 'idle' && !roomRef.current) {
      handleJoinCall({ enableCamMic: false, openCallPanel: false }).catch(() => {});
    }
  }, [currentUserId]);

  // Leave Call handler: closes video call UI and disables media tracks without killing background data channel
  const handleLeaveCall = async () => {
    if (roomRef.current) {
      if (isScreenSharing) {
        try {
          await roomRef.current.localParticipant.setScreenShareEnabled(false);
        } catch {}
      }
      try {
        await roomRef.current.localParticipant.setCameraEnabled(false);
        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      } catch {}
    }
    setLocalCamTrack(null);
    setIsCamEnabled(false);
    setIsMicEnabled(false);
    setIsScreenSharing(false);
    setHasLocalScreenAudio(false);
    setIsOpen(false);
    setIsMinimized(false);
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

      const videoTrack = roomRef.current.localParticipant.getTrackPublication(
        Track.Source.Camera
      )?.track;
      if (nextState && videoTrack) {
        setLocalCamTrack(videoTrack);
      } else if (!nextState) {
        setLocalCamTrack(null);
      }
    } catch (err: any) {
      console.warn('Error toggling camera:', err);
    }
  };

  // Toggle Screen Sharing (Standalone-ready: auto-connects to room if not yet connected)
  const handleToggleScreenShare = async () => {
    if (isStartingScreenShare) return;

    let room = roomRef.current;
    if (!room || callStatus !== 'connected') {
      setIsStartingScreenShare(true);
      room = await handleJoinCall({ enableCamMic: false, openCallPanel: false });
      if (!room) {
        setIsStartingScreenShare(false);
        return;
      }
    }

    if (isScreenSharing) {
      // Stop screen sharing
      setIsStartingScreenShare(true);
      try {
        await room.localParticipant.setScreenShareEnabled(false);
        setIsScreenSharing(false);
        setLocalScreenTrack(null);
        setHasLocalScreenAudio(false);
        if (!isRemoteScreenActiveRef.current) {
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
        await room.localParticipant.setScreenShareEnabled(true, {
          audio: true,
          selfBrowserSurface: 'include',
          surfaceSwitching: 'include',
          systemAudio: 'include',
        });

        const videoPub = room.localParticipant.getTrackPublication(
          Track.Source.ScreenShare
        );
        const audioPub = room.localParticipant.getTrackPublication(
          Track.Source.ScreenShareAudio
        );

        if (videoPub?.track) {
          setIsScreenSharing(true);
          setIsScreenViewerOpen(true);
          setIsScreenViewerMinimized(false);
          setLocalScreenTrack(videoPub.track);
        }

        setHasLocalScreenAudio(Boolean(audioPub?.track));
      } catch (err: any) {
        console.warn('Screen share request cancelled or rejected:', err);
        if (
          err?.name === 'NotAllowedError' ||
          err?.message?.toLowerCase().includes('permission') ||
          err?.message?.toLowerCase().includes('cancel')
        ) {
          // User closed browser picker, normal dismiss
        } else {
          setErrorMessage(err?.message || 'Unable to start screen capture');
        }
        setIsScreenSharing(false);
        setLocalScreenTrack(null);
        setHasLocalScreenAudio(false);
      } finally {
        setIsStartingScreenShare(false);
      }
    }
  };

  // Toggle or Restore Virtual-TV viewer from the dedicated top "TV" button
  const handleToggleTVViewer = () => {
    if (!isScreenViewerOpen) {
      setIsScreenViewerOpen(true);
      setIsScreenViewerMinimized(false);
    } else if (isScreenViewerMinimized) {
      setIsScreenViewerMinimized(false);
    } else {
      // If already open and expanded, clicking TV minimizes it
      setIsScreenViewerMinimized(true);
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

      {/* Top HUD Call Launch / Status Button + Dedicated TV Button */}
      <div className="livekit-hud-anchor" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        {!isOpen ? (
          <button
            type="button"
            className="livekit-join-pill-btn"
            onClick={() => handleJoinCall({ enableCamMic: true, openCallPanel: true })}
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
                ? `Call: ${otherProfile.name}`
                : 'Call: Solo in Room'}
            </span>
          </button>
        )}

        {/* Dedicated TV Button on Top (Always visible) */}
        <button
          type="button"
          id="tv-header-button"
          className={`livekit-tv-pill-btn ${
            isScreenViewerOpen && !isScreenViewerMinimized ? 'active' : ''
          } ${hasAnyActiveScreen ? 'has-broadcast' : ''}`}
          onClick={handleToggleTVViewer}
          title={
            hasAnyActiveScreen
              ? isScreenViewerOpen && !isScreenViewerMinimized
                ? 'Minimize TV Screen'
                : `Watch ${activeSharerName}'s Broadcast`
              : 'Open Living Room TV'
          }
          aria-label="TV"
        >
          <span className="tv-icon">📺</span>
          <span className="tv-text">TV</span>
          {hasAnyActiveScreen && <span className="tv-live-dot" title="Live Broadcast Active" />}
          {isAudioSharedActive && <span className="tv-audio-badge" title="Audio streaming">🔊</span>}
        </button>
      </div>

      {/* ========================================================= */}
      {/* VIRTUAL-TV FLOATING SCREEN SHARE VIEWER                   */}
      {/* ========================================================= */}
      <aside
        className={`livekit-screen-viewer ${
          isScreenViewerMaximized ? 'maximized' : ''
        } ${isScreenViewerMinimized ? 'minimized' : ''} ${
          !isScreenViewerOpen ? 'hidden' : ''
        }`}
        role="dialog"
        aria-label="Live Screen Share TV"
        aria-hidden={!isScreenViewerOpen}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TV Screen Frame Header */}
        <header className="screen-viewer-header">
          <div className="screen-viewer-title-group">
            <span
              className={`livekit-status-dot ${hasAnyActiveScreen ? 'green pulsing' : 'yellow'}`}
            />
            <span className="screen-viewer-tag">
              {hasAnyActiveScreen ? 'LIVE TV BROADCAST' : 'BERK LIVING ROOM TV'}
            </span>
            {hasAnyActiveScreen && (
              <>
                <span className="screen-viewer-sharer">
                  {isScreenSharing ? 'You are sharing' : `${remoteScreenSharerName} is sharing`}
                </span>
                <span
                  className={`screen-audio-indicator ${isAudioSharedActive ? 'active' : 'muted'}`}
                >
                  {isAudioSharedActive ? '🔊 Audio Active' : '🔇 Video Only'}
                </span>
              </>
            )}
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

            {/* Minimize / Restore Toggle */}
            <button
              type="button"
              className="screen-viewer-action-btn"
              onClick={() => setIsScreenViewerMinimized((prev) => !prev)}
              title={isScreenViewerMinimized ? 'Restore Window Size' : 'Minimize to Mini-Bar'}
              aria-label={isScreenViewerMinimized ? 'Restore TV' : 'Minimize TV'}
            >
              {isScreenViewerMinimized ? '▢' : '—'}
            </button>

            {/* Maximize / Restore Toggle (only visible when expanded) */}
            {!isScreenViewerMinimized && (
              <button
                type="button"
                className="screen-viewer-action-btn"
                onClick={() => setIsScreenViewerMaximized((prev) => !prev)}
                title={isScreenViewerMaximized ? 'Restore Window Size' : 'Theater / Maximize View'}
                aria-label={isScreenViewerMaximized ? 'Restore View' : 'Maximize View'}
              >
                {isScreenViewerMaximized ? '⤡' : '⤢'}
              </button>
            )}

            {/* Close / Hide Viewer (doesn't stop stream) */}
            <button
              type="button"
              className="screen-viewer-action-btn"
              onClick={() => setIsScreenViewerOpen(false)}
              title="Close TV (Screen share remains active; click TV on top to reopen)"
              aria-label="Close Screen Viewer"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Screen Share Video Frame */}
        <div className="screen-viewer-body">
          {hasAnyActiveScreen ? (
            <>
              {/* Loading Indicator (auto-clears on first frame, timeupdate, or timer) */}
              {isRemoteScreenLoading && !isScreenSharing && (
                <div className="screen-viewer-loading-overlay">
                  <div className="livekit-pixel-spinner" />
                  <p>Synchronizing video stream...</p>
                </div>
              )}

              {/* Local Video Canvas Element */}
              <video
                ref={(el) => {
                  localScreenVideoRef.current = el;
                  if (el && localScreenTrack) {
                    localScreenTrack.attach(el);
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className={`livekit-screen-video ${!isScreenSharing ? 'hidden' : ''}`}
              />

              {/* Remote Video Canvas Element */}
              <video
                ref={(el) => {
                  remoteScreenVideoRef.current = el;
                  if (el && remoteScreenTrack) {
                    remoteScreenTrack.attach(el);
                    el.play().catch(() => {});
                    if (el.readyState >= 2) {
                      setIsRemoteScreenLoading(false);
                    }
                  }
                }}
                autoPlay
                playsInline
                onLoadedData={() => setIsRemoteScreenLoading(false)}
                onPlaying={() => setIsRemoteScreenLoading(false)}
                onCanPlay={() => setIsRemoteScreenLoading(false)}
                onTimeUpdate={() => setIsRemoteScreenLoading(false)}
                className={`livekit-screen-video ${!isRemoteScreenActive ? 'hidden' : ''}`}
              />

              {/* Retro CRT scanline overlay */}
              <div className="screen-viewer-crt-effect" aria-hidden="true" />
            </>
          ) : (
            <div className="screen-viewer-standby">
              <div className="standby-tv-icon">📺</div>
              <div className="standby-title">BERK LIVING ROOM TV</div>
              <p className="standby-desc">
                No active broadcast in progress. Share your screen to watch videos, games, or work together!
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="standby-action-btn"
                  onClick={handleToggleScreenShare}
                  disabled={isStartingScreenShare}
                >
                  {isStartingScreenShare ? 'Connecting Broadcast...' : '🖥️ Share Screen to TV'}
                </button>
                {callStatus !== 'connected' && (
                  <button
                    type="button"
                    className="standby-action-btn join"
                    onClick={() => handleJoinCall({ enableCamMic: true, openCallPanel: true })}
                  >
                    📞 Join Video Call
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Viewer Footer */}
        <footer className="screen-viewer-footer">
          <span className="screen-hint">
            🎮 BERK Living Room TV •{' '}
            {hasAnyActiveScreen
              ? isScreenSharing
                ? 'Your Shared Display'
                : `${remoteScreenSharerName}'s Broadcast`
              : 'Standby Mode'}
          </span>
          <div className="screen-footer-actions">
            <span className="screen-badge">
              {isScreenViewerMaximized ? 'Theater Mode' : 'Floating TV'}
            </span>
          </div>
        </footer>
      </aside>

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
              <span
                className={`livekit-status-dot ${callStatus === 'connected' ? 'green' : 'yellow'}`}
              />
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

          {/* Body (kept mounted so video elements don't get destroyed and re-mounted) */}
          <div className={`livekit-panel-body ${isMinimized ? 'hidden' : ''}`}>
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
                    ref={(el) => {
                      localVideoRef.current = el;
                      if (el && localCamTrack) {
                        localCamTrack.attach(el);
                        el.play().catch(() => {});
                      }
                    }}
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
                    ref={(el) => {
                      remoteVideoRef.current = el;
                      if (el && remoteCamTrack) {
                        remoteCamTrack.attach(el);
                        el.play().catch(() => {});
                      }
                    }}
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
                      <span className="waiting-text">Solo in Living Room</span>
                      <span className="waiting-subtext">
                        Your mic &amp; camera are live. {otherProfile.name} will appear here when they join.
                      </span>
                    </div>
                  )}
                  <div className="livekit-tile-badge">
                    <span className="badge-name">
                      {hasRemoteParticipant ? remoteParticipantName : `${otherProfile.name} (Offline)`}
                    </span>
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
