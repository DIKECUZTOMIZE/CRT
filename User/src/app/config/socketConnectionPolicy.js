// Decides what the shared socket must do for the authenticated user. The auth cookie is httpOnly,
// so the browser cannot read it; the server authenticates the handshake from the cookie itself.
export const resolveSocketConnectionAction = ({ userId, socketActive, socketUserId }) => {
  if (!userId) {
    return "none";
  }

  if (!socketActive) {
    return "connect";
  }

  return socketUserId === userId ? "none" : "reconnect";
};
