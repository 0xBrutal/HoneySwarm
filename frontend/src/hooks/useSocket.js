import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket(onNewEvent, onSessionUpdated) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('honeyswarm_token');
    if (!token) return; // Only connect if defender is logged in

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token } // Note: we aren't validating this on the backend yet, but it's good practice
    });

    socketRef.current.on('connect', () => console.log('[Socket] Connected to HoneySwarm backend'));
    socketRef.current.on('disconnect', () => console.log('[Socket] Disconnected'));
    
    if (onNewEvent) socketRef.current.on('new_event', onNewEvent);
    if (onSessionUpdated) socketRef.current.on('session_updated', onSessionUpdated);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_event');
        socketRef.current.off('session_updated');
        socketRef.current.disconnect();
      }
    };
  }, [onNewEvent, onSessionUpdated]);

  return socketRef.current;
}
