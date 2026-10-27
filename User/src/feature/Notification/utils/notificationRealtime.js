export const subscribeToNotificationRealtime = ({
  socket,
  joinUserRoom,
  listenToNotifications,
  onUpdate,
}) => {
  // The socket connects asynchronously after login/bootstrap, so join on every (re)connect.
  const handleConnect = () => joinUserRoom();

  if (socket.connected) {
    joinUserRoom();
  }

  socket.on("connect", handleConnect);
  const stopListening = listenToNotifications(onUpdate);

  return () => {
    socket.off("connect", handleConnect);
    stopListening();
  };
};
