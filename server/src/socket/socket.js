let io;

export const initializeSocket = (socketIo) => {
  io = socketIo;

  io.on("connection", (socket) => {
    console.log(
      "Socket connected:",
      socket.id
    );

    socket.on(
      "join-user-room",
      (userId) => {
        if (!userId) {
          return;
        }

        const room = `user:${userId}`;

        socket.join(room);

        console.log(
          `User ${userId} joined room ${room}`
        );
      }
    );

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected:",
        socket.id
      );
    });
  });
};

export const emitFileProcessing = (
  userId,
  data
) => {
  if (!io) {
    console.warn(
      "Socket.io not initialized"
    );
    return;
  }

  const room = `user:${userId}`;

  console.log(
    `Emitting file:processing → ${room}`,
    data
  );

  io.to(room).emit(
    "file:processing",
    data
  );
};

export const emitFileProcessed = (
  userId,
  data
) => {
  if (!io) {
    console.warn(
      "Socket.io not initialized"
    );
    return;
  }

  const room = `user:${userId}`;

  console.log(
    `Emitting file:processed → ${room}`,
    data
  );

  io.to(room).emit(
    "file:processed",
    data
  );
};

export const emitFileFailed = (
  userId,
  data
) => {
  if (!io) {
    console.warn(
      "Socket.io not initialized"
    );
    return;
  }

  const room = `user:${userId}`;

  console.log(
    `Emitting file:failed → ${room}`,
    data
  );

  io.to(room).emit(
    "file:failed",
    data
  );
};