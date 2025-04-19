import client from "../providers/client";

export const createPlayer = async (data) => {
  const response = await client.post(`/players`, data);
  return response.data;
};

export const deletePlayer = async (id) => {
  const response = await client.delete(`/players/${id}`);
  return response.data;
};
