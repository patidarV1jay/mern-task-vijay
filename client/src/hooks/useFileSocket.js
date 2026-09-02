// src/hooks/useFileSocket.js

import { useEffect } from "react";
import { io } from "socket.io-client";

export function useFileSocket(userId, onFileUpdated) {
  useEffect(() => {
    if (!userId) {
      console.log("Socket not started: userId missing");
      return;
    }

    const socket = io(
      'http://localhost:5000',
      {
        transports: ["websocket"],
      }
    );

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      // IMPORTANT:
      // This must match the backend event name
      socket.emit(
        "join-user-room",
        userId
      );

      console.log(
        "Joining room:",
        `user:${userId}`
      );
    });

    socket.on(
      "file:processed",
      (data) => {
        console.log(
          "Received file:processed",
          data
        );

        onFileUpdated?.(data);
      }
    );

    socket.on(
      "file:failed",
      (data) => {
        console.log(
          "Received file:failed",
          data
        );

        onFileUpdated?.(data);
      }
    );

    socket.on(
      "file:processing",
      (data) => {
        console.log(
          "Received file:processing",
          data
        );

        onFileUpdated?.(data);
      }
    );

    socket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message
      );
    });

    socket.on("disconnect", (reason) => {
      console.log(
        "Socket disconnected:",
        reason
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, onFileUpdated]);
}