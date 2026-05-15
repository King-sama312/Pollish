import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/**
 * Custom hook that manages a singleton Socket.IO connection.
 *
 * - Connects on first mount, disconnects when no component uses it.
 * - Re-uses the same socket instance across components.
 * - Returns the socket instance (or null while connecting).
 */
let socketInstance = null;
let referenceCount = 0;

export default function useSocket() {
  const [socket, setSocket] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    referenceCount++;

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      socketInstance.on("connect", () => {
        console.log("Socket.IO connected:", socketInstance.id);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("Socket.IO disconnected:", reason);
      });
    }

    setSocket(socketInstance);

    return () => {
      mountedRef.current = false;
      referenceCount--;
      if (referenceCount <= 0) {
        referenceCount = 0;
        if (socketInstance) {
          socketInstance.disconnect();
          socketInstance = null;
        }
      }
    };
  }, []);

  return socket;
}
