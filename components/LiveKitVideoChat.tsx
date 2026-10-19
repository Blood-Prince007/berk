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
  const [isRemoteInCall, setIsRemoteInCall] = useState<boolean>(false);

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

  // Reactive Track States
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

  // State refs to eliminate stale closures
  const isScreenSharingRef = useRef<boolean>(false);
  const isRemoteScreenActiveRef = useRef<boolean>(false);
  const isOpenRef = useRef<boolean>(false);
  const isCamEnabledRef = useRef<boolean>(true);
  const isMountedRef = useRef<boolean>(true);
  const hasUserLeftCallRef = useRef<boolean>(false);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  useEffect(() => {
    isRemoteScreenActiveRef.current = isRemoteScreenActive;
  }, [isRemoteScreenActive]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isCamEnabledRef.current = isCamEnabled;
  }, [isCamEnabled]);

  // Stable callback refs from parent to prevent unnecessary room disconnections or re-renders
  const onScreenVideoElementChangeRef = useRef(onScreenVideoElementChange);
  useEffect(() => {
    onScreenVideoElementChangeRef.current = onScreenVideoElementChange;
  }, [onScreenVideoElementChange]);

  const onRemoteParticipantChangeRef = useRef(onRemoteParticipantChange);
  useEffect(() => {
    onRemoteParticipantChangeRef.current = onRemoteParticipantChange;
  }, [onRemoteParticipantChange]);

  const onPositionDataReceivedRef = useRef(onPositionDataReceived);
  useEffect(() => {
    onPositionDataReceivedRef.current = onPositionDataReceived;
  }, [onPositionDataReceived]);

  const onSendPositionDataReadyRef = useRef(onSendPositionDataReady);
  useEffect(() => {
    onSendPositionDataReadyRef.current = onSendPositionDataReady;
  }, [onSendPositionDataReady]);

  // Participant names
  const localProfile = AUTHORIZED_USERS[currentUserId] || AUTHORIZED_USERS[SOPREMISH_USER_ID];
  const otherUserId = currentUserId === SOPREMISH_USER_ID ? GRAPE_USER_ID : SOPREMISH_USER_ID;
  const otherProfile = AUTHORIZED_USERS[otherUserId] || AUTHORIZED_USERS[GRAPE_USER_ID];

  // Inform parent when screen video element is mounted/changed
  useEffect(() => {
    if (!onScreenVideoElementChangeRef.current) return;
    if (isRemoteScreenActive && remoteScreenVideoRef.current) {
      onScreenVideoElementChangeRef.current(remoteScreenVideoRef.current);
    } else if (isScreenSharing && localScreenVideoRef.current) {
      onScreenVideoElementChangeRef.current(localScreenVideoRef.current);
    } else {
      onScreenVideoElementChangeRef.current(null);
    }
  }, [
    isRemoteScreenActive,
    isScreenSharing,
    remoteScreenTrack,
    localScreenTrack,
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
    setIsRemoteInCall(false);
    setHasRemoteScreenAudio(false);
    setIsRemoteScreenLoading(false);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (remoteScreenVideoRef.current) remoteScreenVideoRef.current.srcObject = null;
    if (remoteScreenAudioRef.current) remoteScreenAudioRef.current.srcObject = null;
    if (!isScreenSharingRef.current && onScreenVideoElementChangeRef.current) {
      onScreenVideoElementChangeRef.current(null);
    }
  }, []);

  // Helper to cleanly detach all tracks (local + remote) on full leave or unmount
  const detachAllTracks = useCallback(() => {
    detachRemoteTracks();
    setLocalScreenTrack(null);
    setLocalCamTrack(null);
    setIsScreenSharing(false);
    setHasLocalScreenAudio(false);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (localScreenVideoRef.current) localScreenVideoRef.current.srcObject = null;
    if (onScreenVideoElementChangeRef.current) onScreenVideoElementChangeRef.current(null);
  }, [detachRemoteTracks]);

  // Centralized synchronization helper for participants and all remote tracks
  const syncRoomParticipants = useCallback((room: Room | null) => {
    if (!room || room.state !== 'connected') return;

    const remotes = Array.from(room.remoteParticipants.values());
    const hasRemote = remotes.length > 0;
    setHasRemoteParticipant(hasRemote);
    onRemoteParticipantChangeRef.current?.(hasRemote);

    if (hasRemote) {
      const peer = remotes[0];
      setRemoteParticipantName(peer.name || otherProfile.name);

      let peerCamTrack: Track | null = null;
      let peerMicTrack: Track | null = null;
      let peerScreenTrack: Track | null = null;
      let peerScreenAudioTrack: Track | null = null;

      for (const pub of Array.from(peer.trackPublications.values())) {
        if (!pub.isSubscribed) {
          try {
            pub.setSubscribed(true);
          } catch {}
        }
        if (pub.source === Track.Source.Camera && pub.track) {
          peerCamTrack = pub.track;
        } else if (pub.source === Track.Source.Microphone && pub.track) {
          peerMicTrack = pub.track;
        } else if (pub.source === Track.Source.ScreenShare && pub.track) {
          peerScreenTrack = pub.track;
        } else if (pub.source === Track.Source.ScreenShareAudio && pub.track) {
          peerScreenAudioTrack = pub.track;
        }
      }

      const remoteCalling = Boolean(peerCamTrack || peerMicTrack || peerScreenTrack);
      setIsRemoteInCall(remoteCalling);

      if (peerCamTrack) {
        setRemoteCamTrack(peerCamTrack);
        setIsRemoteCamActive(true);
        if (remoteVideoRef.current) {
          peerCamTrack.attach(remoteVideoRef.current);
          remoteVideoRef.current.play().catch(() => {});
        }
      } else {
        setIsRemoteCamActive(false);
      }

      if (peerMicTrack) {
        setRemoteMicTrack(peerMicTrack);
        setIsRemoteMicActive(true);
        if (remoteAudioRef.current) {
          peerMicTrack.attach(remoteAudioRef.current);
          remoteAudioRef.current.play().catch(() => {});
        }
      } else {
        setIsRemoteMicActive(false);
      }

      if (peerScreenTrack) {
        setRemoteScreenSharerName(peer.name || otherProfile.name);
        setIsRemoteScreenActive(true);
        setRemoteScreenTrack(peerScreenTrack);
      }

      if (peerScreenAudioTrack) {
        setHasRemoteScreenAudio(true);
        setRemoteScreenAudioTrack(peerScreenAudioTrack);
      }

      // If partner is in call with camera/mic and user hasn't explicitly left, auto-open call window
      if (remoteCalling && !isOpenRef.current && !hasUserLeftCallRef.current) {
        setIsOpen(true);
        setIsMinimized(false);
      }
    } else {
      setIsRemoteInCall(false);
      setIsRemoteCamActive(false);
      setIsRemoteMicActive(false);
    }
  }, [otherProfile.name]);

  const syncRoomParticipantsRef = useRef(syncRoomParticipants);
  useEffect(() => {
    syncRoomParticipantsRef.current = syncRoomParticipants;
  }, [syncRoomParticipants]);

  // Periodic 2-second heartbeat sync: guarantees tracks and participant status stay 100% in sync
  useEffect(() => {
    const timer = setInterval(() => {
      if (roomRef.current && roomRef.current.state === 'connected') {
        syncRoomParticipantsRef.current(roomRef.current);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Browser Tab Switching & Focus Watcher: keeps video and audio playing ALWAYS
  useEffect(() => {
    const handleResumeMedia = () => {
      if (document.visibilityState === 'visible' || !document.hidden) {
        if (remoteVideoRef.current && remoteCamTrack) {
          remoteVideoRef.current.play().catch(() => {});
        }
        if (localVideoRef.current && localCamTrack) {
          localVideoRef.current.play().catch(() => {});
        }
        if (remoteAudioRef.current && remoteMicTrack) {
          remoteAudioRef.current.play().catch(() => {});
        }
        if (remoteScreenVideoRef.current && remoteScreenTrack) {
          remoteScreenVideoRef.current.play().catch(() => {});
        }
        if (localScreenVideoRef.current && localScreenTrack) {
          localScreenVideoRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleResumeMedia);
    window.addEventListener('focus', handleResumeMedia);
    return () => {
      document.removeEventListener('visibilitychange', handleResumeMedia);
      window.removeEventListener('focus', handleResumeMedia);
    };
  }, [remoteCamTrack, localCamTrack, remoteMicTrack, remoteScreenTrack, localScreenTrack]);

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

  // Cleanup on unmount ONLY
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
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
    hasUserLeftCallRef.current = false;

    // If room is already active in background, quickly open panel and enable cam/mic
    if (roomRef.current && roomRef.current.state === 'connected') {
      const room = roomRef.current;
      if (openCallPanel) {
        setIsOpen(true);
        setIsMinimized(false);
      }
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
      }
      syncRoomParticipantsRef.current(room);
      return room;
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

      // 2. Initialize LiveKit Room instance with persistent streaming (adaptiveStream & dynacast disabled for 1-on-1 permanence)
      const room = new Room({
        adaptiveStream: false,
        dynacast: false,
        stopLocalTrackOnUnpublish: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h360.resolution,
        },
      });
      roomRef.current = room;

      // 3. Register Event Listeners
      room.on(RoomEvent.Connected, () => {
        setCallStatus('connected');
        syncRoomParticipantsRef.current(room);

        // Expose real-time position data sender
        if (onSendPositionDataReadyRef.current) {
          onSendPositionDataReadyRef.current((posData: any) => {
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
          if (parsed?.type === 'player_move' && onPositionDataReceivedRef.current) {
            onPositionDataReceivedRef.current(parsed);
          }
        } catch {}
      });

      room.on(RoomEvent.Reconnecting, () => {
        setCallStatus('reconnecting');
      });

      room.on(RoomEvent.Reconnected, () => {
        setCallStatus('connected');
        syncRoomParticipantsRef.current(room);
      });

      room.on(RoomEvent.Disconnected, () => {
        setCallStatus('idle');
        setHasRemoteParticipant(false);
        setIsRemoteInCall(false);
        onRemoteParticipantChangeRef.current?.(false);
        onSendPositionDataReadyRef.current?.(null);
        setIsScreenSharing(false);
        setIsRemoteScreenActive(false);
        setIsScreenViewerOpen(false);
        detachAllTracks();

        // Auto-reconnect background room if still mounted
        if (isMountedRef.current && !hasUserLeftCallRef.current) {
          setTimeout(() => {
            if (isMountedRef.current && !roomRef.current) {
              handleJoinCall({ enableCamMic: false, openCallPanel: false }).catch(() => {});
            }
          }, 1500);
        }
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        setHasRemoteParticipant(true);
        onRemoteParticipantChangeRef.current?.(true);
        setRemoteParticipantName(participant.name || otherProfile.name);
        syncRoomParticipantsRef.current(room);
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        const hasRemote = room.remoteParticipants.size > 0;
        setHasRemoteParticipant(hasRemote);
        onRemoteParticipantChangeRef.current?.(hasRemote);
        detachRemoteTracks();
        syncRoomParticipantsRef.current(room);
      });

      // Detect when a track is published immediately (instant window open & track sync)
      room.on(
        RoomEvent.TrackPublished,
        (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          setHasRemoteParticipant(true);
          onRemoteParticipantChangeRef.current?.(true);
          setRemoteParticipantName(participant.name || otherProfile.name);

          if (publication.source === Track.Source.ScreenShare) {
            setRemoteScreenSharerName(participant.name || otherProfile.name);
            setIsRemoteScreenActive(true);
            setIsScreenViewerOpen(true);
            setIsScreenViewerMinimized(false);
            setIsRemoteScreenLoading(true);
          } else if (publication.source === Track.Source.ScreenShareAudio) {
            setHasRemoteScreenAudio(true);
          }

          if (!publication.isSubscribed) {
            try {
              publication.setSubscribed(true);
            } catch {}
          }
          syncRoomParticipantsRef.current(room);
        }
      );

      // Detect when a track is unpublished immediately
      room.on(RoomEvent.TrackUnpublished, (publication: RemoteTrackPublication) => {
        if (publication.source === Track.Source.ScreenShare) {
          setIsRemoteScreenActive(false);
          setRemoteScreenTrack(null);
          setIsRemoteScreenLoading(false);
          if (remoteScreenVideoRef.current) {
            remoteScreenVideoRef.current.srcObject = null;
          }
          if (!isScreenSharingRef.current && onScreenVideoElementChangeRef.current) {
            onScreenVideoElementChangeRef.current(null);
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
        syncRoomParticipantsRef.current(room);
      });

      // Handle incoming remote media tracks (Differentiating ScreenShare from Webcam/Mic)
      room.on(
        RoomEvent.TrackSubscribed,
        (track: Track, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          setHasRemoteParticipant(true);
          onRemoteParticipantChangeRef.current?.(true);
          setRemoteParticipantName(participant.name || otherProfile.name);

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
            if (remoteVideoRef.current) {
              track.attach(remoteVideoRef.current);
              remoteVideoRef.current.play().catch(() => {});
            }
          } else if (
            publication.source === Track.Source.Microphone &&
            track.kind === Track.Kind.Audio
          ) {
            setRemoteMicTrack(track);
            setIsRemoteMicActive(true);
            if (remoteAudioRef.current) {
              track.attach(remoteAudioRef.current);
              remoteAudioRef.current.play().catch(() => {});
            }
          }
          syncRoomParticipantsRef.current(room);
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
            if (!isScreenSharingRef.current && onScreenVideoElementChangeRef.current) {
              onScreenVideoElementChangeRef.current(null);
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
          syncRoomParticipantsRef.current(room);
        }
      );

      // Tab switches and network blips trigger TrackMuted - we NEVER hide the video element!
      room.on(RoomEvent.TrackMuted, () => {
        // Keep video element mounted and visible
      });

      room.on(RoomEvent.TrackUnmuted, () => {
        syncRoomParticipantsRef.current(room);
      });

      // Handle local tracks publication & native browser stop-sharing detection
      room.on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
        if (
          publication.source === Track.Source.Camera &&
          publication.track?.kind === Track.Kind.Video
        ) {
          setLocalCamTrack(publication.track);
          setIsCamEnabled(true);
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
            if (!isRemoteScreenActiveRef.current && onScreenVideoElementChangeRef.current) {
              onScreenVideoElementChangeRef.current(null);
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
          if (!isRemoteScreenActiveRef.current && onScreenVideoElementChangeRef.current) {
            onScreenVideoElementChangeRef.current(null);
          }
        } else if (publication.source === Track.Source.ScreenShareAudio) {
          setHasLocalScreenAudio(false);
        } else if (publication.source === Track.Source.Camera) {
          setLocalCamTrack(null);
          setIsCamEnabled(false);
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

      syncRoomParticipantsRef.current(room);
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
    hasUserLeftCallRef.current = true;
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
          if (onScreenVideoElementChangeRef.current) onScreenVideoElementChangeRef.current(null);
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
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Hidden Audio element for remote participant screen share audio */}
      <audio ref={remoteScreenAudioRef} autoPlay playsInline />

      {/* Top HUD Call Launch / Status Button + Dedicated TV Button */}
      <div className="livekit-hud-anchor" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        {!isOpen ? (
          <button
            type="button"
            className={`livekit-join-pill-btn ${isRemoteInCall ? 'incoming-call' : ''}`}
            onClick={() => handleJoinCall({ enableCamMic: true, openCallPanel: true })}
            title={
              isRemoteInCall
                ? `${otherProfile.name} is in call! Click to join`
                : 'Start or join private Living Room video call'
            }
            aria-label="Join Video Call"
          >
            <span className={`livekit-pill-icon ${isRemoteInCall ? 'pulsing' : ''}`}>
              {isRemoteInCall ? '🟢' : '📞'}
            </span>
            <span className="livekit-pill-text">
              {isRemoteInCall ? `Join Call (${otherProfile.name} calling)` : 'Join Call'}
            </span>
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
                ? isRemoteInCall || isCamEnabled
                  ? `Call: ${otherProfile.name} (2/2)`
                  : `Call: ${otherProfile.name}`
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
                onPause={(e) => {
                  if (localScreenTrack) {
                    e.currentTarget.play().catch(() => {});
                  }
                }}
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
                onPause={(e) => {
                  if (remoteScreenTrack) {
                    e.currentTarget.play().catch(() => {});
                  }
                }}
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
                  {hasRemoteParticipant && (isRemoteInCall || isCamEnabled) ? '2/2' : '1/2'}
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
                    onPause={(e) => {
                      if (callStatus === 'connected' && localCamTrack && isCamEnabled) {
                        e.currentTarget.play().catch(() => {});
                      }
                    }}
                    onCanPlay={(e) => {
                      e.currentTarget.play().catch(() => {});
                    }}
                    className={`livekit-video-element mirrored ${!isCamEnabled || !localCamTrack ? 'hidden' : ''}`}
                  />
                  {(!isCamEnabled || !localCamTrack) && (
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
                    onPause={(e) => {
                      if (callStatus === 'connected' && remoteCamTrack) {
                        e.currentTarget.play().catch(() => {});
                      }
                    }}
                    onCanPlay={(e) => {
                      e.currentTarget.play().catch(() => {});
                    }}
                    className={`livekit-video-element ${!isRemoteCamActive || !remoteCamTrack ? 'hidden' : ''}`}
                  />
                  {hasRemoteParticipant && (!isRemoteCamActive || !remoteCamTrack) && (
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
                      {hasRemoteParticipant
                        ? `${remoteParticipantName}${isRemoteInCall ? '' : ' (In Room)'}`
                        : `${otherProfile.name} (Offline)`}
                    </span>
                    {hasRemoteParticipant && (
                      <span className="badge-icons">
                        {!isRemoteMicActive && <span title="Remote Mic Inactive">🔇</span>}
                        {isRemoteCamActive && <span title="Camera Active">📹</span>}
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

              {/* Screen Share Toggle Button */}
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
