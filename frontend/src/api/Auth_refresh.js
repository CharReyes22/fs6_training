import axios from "axios";
import { BASE_URL } from "./base";

export const authRequest = async (method, url, data = null) => {
  try {
    return await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
  } catch (error) {
    if (error.response?.status !== 401) throw error;

    // refresh token
    const refreshResponse = await axios.post(`${BASE_URL}/api/token/refresh/`, {
      refresh: localStorage.getItem("refresh_token"),
    });

    const newAccess = refreshResponse.data.access;
    localStorage.setItem("access_token", newAccess);

    // retry original request
    return axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers: {
        Authorization: `Bearer ${newAccess}`,
      },
    });
  }
};
