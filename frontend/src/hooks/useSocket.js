import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket(onNewEvent, onSessionUpdated, onScenarioProgress) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('honeyswarm_token');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socketRef.current.on('connect', () => console.log('[Socket] Connected to HoneySwarm backend'));
    socketRef.current.on('disconnect', () => console.log('[Socket] Disconnected'));

    if (onNewEvent) socketRef.current.on('new_event', onNewEvent);
    if (onSessionUpdated) socketRef.current.on('session_updated', onSessionUpdated);
    if (onScenarioProgress) socketRef.current.on('scenario_progress', onScenarioProgress);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_event');
        socketRef.current.off('session_updated');
        socketRef.current.off('scenario_progress');
        socketRef.current.disconnect();
      }
    };
  }, [onNewEvent, onSessionUpdated, onScenarioProgress]);

  return socketRef.current;
}
