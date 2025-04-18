import client from "../providers/client";

export const joinArena = async (userId, roomId) => {
  client.defaults.headers.common["userid"] = parseInt(userId);
  const response = await client.post(`/arenas/${roomId}/join`);
  return response.data;
};
