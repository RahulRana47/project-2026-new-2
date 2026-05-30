const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const AUTH_BASE_URL = `${API_BASE}/api/users`;
const POSTS_BASE_URL = `${API_BASE}/api/posts`;
const BOOKINGS_BASE_URL = `${API_BASE}/api/bookings`;
const REVIEWS_BASE_URL = `${API_BASE}/api/reviews`;
const CHAT_BASE_URL = `${API_BASE}/api/chat`;
const ITINERARY_BASE_URL = `${API_BASE}/api/itinerary`;

const fallbackGuides = [
  {
    _id: "demo-1",  
    name: "Aarav Mehta",
    location: { city: "Delhi", state: "Delhi" },
    price: 1500,
    avatar: "",
  },
  {
    _id: "demo-2",
    name: "Sara Khan",
    location: { city: "Mumbai", state: "Maharashtra" },
    price: 1800,
    avatar: "",
  },
  {
    _id: "demo-3",
    name: "Kabir Singh",
    location: { city: "Jaipur", state: "Rajasthan" },
    price: 1200,
    avatar: "",
  },
];

const parseJSON = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch (err) {
      return { success: false, message: "Invalid JSON response", error: err?.message };
    }
  }
  const text = await res.text();
  return {
    success: false,
    message: `Expected JSON but got ${res.status} ${res.statusText}`,
    status: res.status,
    raw: text,
  };
};

const parseJSONOrThrow = async (res) => {
  const data = await parseJSON(res);

  if (!res.ok || data?.success === false || data?.error) {
    const error = new Error(data?.message || data?.error || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

const buildAuthHeaders = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registerUser = async (data) => {
  const res = await fetch(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const verifyOtp = async (data) => {
  const res = await fetch(`${AUTH_BASE_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const loginUser = async (data) => {
  const res = await fetch(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const firebaseAuthUser = async (data) => {
  const res = await fetch(`${AUTH_BASE_URL}/firebase-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const getMe = async (token) => {
  const res = await fetch(`${AUTH_BASE_URL}/me`, {
    headers: buildAuthHeaders(token),
  });
  const data = await parseJSON(res);
  return { ...data, status: res.status };
};

export const resendOtp = async (email) => {
  const res = await fetch(`${AUTH_BASE_URL}/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseJSON(res);
};

export const getGuides = async () => {
  const candidateUrls = [`${AUTH_BASE_URL}/guides`, `${API_BASE}/api/guides`];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const parsed = await parseJSON(res);
        if ((parsed?.guides && parsed.guides.length) || Array.isArray(parsed)) {
          return parsed;
        }
      }
      if (url === `${AUTH_BASE_URL}/guides` || res.status !== 404) {
        return parseJSON(res);
      }
    } catch (err) {
      console.warn("Guide fetch failed for", url, err);
    }
  }

  return { success: true, guides: fallbackGuides, source: "local" };
};

export const getAdminUsers = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${AUTH_BASE_URL}/admin/users`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const updateUserBlockStatus = async (userId, { isBlocked, reason }) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${AUTH_BASE_URL}/admin/users/${userId}/block`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ isBlocked, reason }),
  });
  return parseJSONOrThrow(res);
};

// POSTS API
export const getPosts = async (page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams();

  if (page !== undefined && page !== null) params.set("page", String(page));
  if (limit !== undefined && limit !== null) params.set("limit", String(limit));
  if (filters.city) params.set("city", filters.city);
  if (filters.state) params.set("state", filters.state);

  const query = params.toString();
  const res = await fetch(`${API_BASE}/api/posts/all${query ? `?${query}` : ""}`);
  return parseJSON(res);
};

const appendLocationFields = (formData, location) => {
  if (!location) return;

  if (typeof location === "string") {
    formData.append("location", location);
    return;
  }

  formData.append("location", JSON.stringify(location));
};

export const createPost = async ({ title, body, price, photoFile, location }) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("title", title || "");
  formData.append("body", body || "");
  formData.append("price", price ?? "");
  appendLocationFields(formData, location);
  if (photoFile) formData.append("photo", photoFile);

  const res = await fetch(`${API_BASE}/api/posts/create`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  return parseJSON(res);
};

export const getMyPosts = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/posts/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return parseJSON(res);
};

export const updatePost = async (postId, { title, body, price, photoFile, location }) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  if (title !== undefined) formData.append("title", title);
  if (body !== undefined) formData.append("body", body);
  if (price !== undefined) formData.append("price", price);
  appendLocationFields(formData, location);
  if (photoFile) formData.append("photo", photoFile);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/api/posts/update/${postId}`, {
    method: "PUT",
    headers,
    body: formData,
  });
  return parseJSON(res);
};

export const deletePost = async (postId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/posts/delete/${postId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return parseJSON(res);
};

export const getNotifications = async ({ page = 1, limit = 20 } = {}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const res = await fetch(`${API_BASE}/api/notifications?${params.toString()}`, {
    headers: buildAuthHeaders(token),
  });

  return parseJSONOrThrow(res);
};

export const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
  });

  return parseJSONOrThrow(res);
};

export const markAllNotificationsAsRead = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
  });

  return parseJSONOrThrow(res);
};

export const likePost = async (postId) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/posts/like/${postId}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return parseJSON(res);
};

export const dislikePost = async (postId) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/posts/unlike/${postId}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return parseJSON(res);
};

export const commentPost = async (postId, text) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}/api/posts/comment/${postId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ text }),
  });

  return parseJSON(res);
};

export const deleteComment = async (postId, commentId) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/posts/comment/${postId}/${commentId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return parseJSON(res);
};

export const getPostPackages = async (postId) => {
  const res = await fetch(`${POSTS_BASE_URL}/${postId}/packages`);
  return parseJSONOrThrow(res);
};

export const createBooking = async ({ postId, tourDate, startDate, endDate, durationType, numberOfPeople, selectedPackage, specialRequests }) => {
   const token = localStorage.getItem("token");

   const res = await fetch(`${BOOKINGS_BASE_URL}/create`, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       ...buildAuthHeaders(token),
     },
     body: JSON.stringify({
       postId,
       tourDate,
       startDate,
       endDate,
       durationType,
       numberOfPeople,
       selectedPackage,
       specialRequests,
     }),
   });

   return parseJSONOrThrow(res);
 };

export const getMyBookings = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BOOKINGS_BASE_URL}/my-bookings`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const getGuideBookings = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BOOKINGS_BASE_URL}/guide-bookings`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const getAdminBookingStats = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BOOKINGS_BASE_URL}/admin/stats`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const cancelBooking = async (bookingId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BOOKINGS_BASE_URL}/cancel/${bookingId}`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const requestBookingStatusOtp = async (bookingId, status = "confirmed") => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BOOKINGS_BASE_URL}/status/${bookingId}/otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ status }),
  });
  return parseJSONOrThrow(res);
};

export const updateBookingStatus = async (bookingId, status, otp, cancellationReason) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BOOKINGS_BASE_URL}/status/${bookingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ status, otp, cancellationReason }),
  });
  return parseJSONOrThrow(res);
};

export const getBookingDetails = async (bookingId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BOOKINGS_BASE_URL}/${bookingId}`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const getGuideAvailability = async (guideId, { from, to } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  const res = await fetch(`${BOOKINGS_BASE_URL}/availability/${guideId}${query ? `?${query}` : ""}`);
  return parseJSONOrThrow(res);
};

export const blockGuideAvailability = async ({ startDate, endDate, reason }) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BOOKINGS_BASE_URL}/availability/block`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ startDate, endDate, reason }),
  });
  return parseJSONOrThrow(res);
};

export const deleteGuideAvailability = async (availabilityId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BOOKINGS_BASE_URL}/availability/${availabilityId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const getGuideReviews = async (guideId) => {
  const res = await fetch(`${REVIEWS_BASE_URL}/guide/${guideId}`);
  return parseJSONOrThrow(res);
};

export const getGuideReviewStats = async (guideId) => {
  const res = await fetch(`${REVIEWS_BASE_URL}/stats/${guideId}`);
  return parseJSONOrThrow(res);
};

export const getMyReviews = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${REVIEWS_BASE_URL}/my-reviews`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const createReview = async ({ bookingId, rating, comment }) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${REVIEWS_BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ bookingId, rating, comment }),
  });
  return parseJSONOrThrow(res);
};

export const updateReview = async (reviewId, payload) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${REVIEWS_BASE_URL}/update/${reviewId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  return parseJSONOrThrow(res);
};

export const deleteReview = async (reviewId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${REVIEWS_BASE_URL}/delete/${reviewId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const getMyChats = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${CHAT_BASE_URL}/chats`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const getOrCreateGuideChat = async (guideId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${CHAT_BASE_URL}/chat/guide/${guideId}`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const getChatMessages = async (chatId, { page = 1, limit = 50 } = {}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const res = await fetch(`${CHAT_BASE_URL}/chat/${chatId}/messages?${params.toString()}`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const sendChatMessage = async ({ chatId, receiverId, message, messageType = "text", fileUrl = null }) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${CHAT_BASE_URL}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({
      chatId,
      receiverId,
      message,
      messageType,
      fileUrl,
    }),
  });
  return parseJSONOrThrow(res);
};

export const getUnreadChatCount = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${CHAT_BASE_URL}/unread-count`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const createItinerary = async ({ title, destination, startDate, endDate }) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ITINERARY_BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ title, destination, startDate, endDate }),
  });
  return parseJSONOrThrow(res);
};

export const addPostToItinerary = async (itineraryId, { postId, day, time, notes }) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ITINERARY_BASE_URL}/${itineraryId}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ postId, day, time, notes }),
  });
  return parseJSONOrThrow(res);
};

export const getMyItineraries = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ITINERARY_BASE_URL}/`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const getItinerary = async (itineraryId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ITINERARY_BASE_URL}/${itineraryId}`, {
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const updateItineraryActivity = async (itineraryId, activityId, payload) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ITINERARY_BASE_URL}/${itineraryId}/activity/${activityId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  return parseJSONOrThrow(res);
};

export const removeItineraryActivity = async (itineraryId, activityId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ITINERARY_BASE_URL}/${itineraryId}/activity/${activityId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const reorderItineraryActivities = async (itineraryId, activities) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ITINERARY_BASE_URL}/${itineraryId}/reorder`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ activities }),
  });
  return parseJSONOrThrow(res);
};

export const deleteItinerary = async (itineraryId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ITINERARY_BASE_URL}/${itineraryId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const shareItinerary = async (itineraryId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ITINERARY_BASE_URL}/${itineraryId}/share`, {
    method: "POST",
    headers: buildAuthHeaders(token),
  });
  return parseJSONOrThrow(res);
};

export const getSharedItinerary = async (shareCode) => {
  const res = await fetch(`${ITINERARY_BASE_URL}/shared/${shareCode}`);
  return parseJSONOrThrow(res);
};

export const getItineraryExportUrl = (itineraryId) => {
  return `${ITINERARY_BASE_URL}/${itineraryId}/export`;
};

export const exportItineraryPDF = async (itineraryId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(getItineraryExportUrl(itineraryId), {
    headers: buildAuthHeaders(token),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await parseJSON(res);
      throw new Error(data?.message || data?.error || "Unable to export itinerary.");
    }
    throw new Error(`Unable to export itinerary. Status ${res.status}`);
  }

  return res.blob();
};
