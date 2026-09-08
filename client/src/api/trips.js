import api from "./axios";

export const getTrips = () => api.get("/trips");
export const createTrip = (data) => api.post("/trips", data);
export const getTrip = (id) => api.get(`/trips/${id}`);
export const updateTripStatus = (id, status) =>
  api.patch(`/trips/${id}/status`, { status });

export const leaveTrip = (id) => api.post(`/trips/${id}/leave`);

export const requestJoin = (tripId) => api.post(`/trips/${tripId}/join`);
export const getJoinRequests = (tripId) => api.get(`/trips/${tripId}/join-requests`);
export const decideJoinRequest = (requestId, decision) =>
  api.patch(`/join-requests/${requestId}`, { decision });

export const createReview = (tripId, data) => api.post(`/trips/${tripId}/reviews`, data);
export const getTripReviews = (tripId) => api.get(`/trips/${tripId}/reviews`);

export const getProposals = (tripId) => api.get(`/trips/${tripId}/proposals`);
export const createProposal = (tripId, data) =>
  api.post(`/trips/${tripId}/proposals`, data);
export const voteOnProposal = (proposalId, agree) =>
  api.post(`/proposals/${proposalId}/vote`, { agree });
export const decideProposal = (proposalId, decision) =>
  api.patch(`/proposals/${proposalId}`, { decision });

export const getTripMessages = (tripId) => api.get(`/trips/${tripId}/messages`);
export const sendTripMessage = (tripId, text) =>
  api.post(`/trips/${tripId}/messages`, { text });

export const getJoinRequestMessages = (requestId) =>
  api.get(`/join-requests/${requestId}/messages`);
export const sendJoinRequestMessage = (requestId, text) =>
  api.post(`/join-requests/${requestId}/messages`, { text });
