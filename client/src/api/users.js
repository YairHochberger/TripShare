import api from "./axios";

export const getMe = () => api.get("/users/me");
export const updateMe = (data) => api.patch("/users/me", data);
export const getUser = (id) => api.get(`/users/${id}`);
export const getUserTrips = (id) => api.get(`/users/${id}/trips`);
export const getUserReviews = (id) => api.get(`/users/${id}/reviews`);
