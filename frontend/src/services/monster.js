import client from "../providers/client";

export const randomMonster = async (id) => {
  const response = await client.get(`/monsters/${id}`);
  return response.data;
};
