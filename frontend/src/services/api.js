const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const BASE_URL = `${API_BASE}/api/users`;

export const registerUser = async (data) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const verifyOtp = async (data) => {
  const res = await fetch(`${BASE_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getMe = async (token) => {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const resendOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const getGuides = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/guides`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

// POSTS API
export const getPosts = async (page = 1, limit = 10) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/posts/all?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const createPost = async ({ title, body, photoFile, location }) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("title", title || "");
  formData.append("body", body || "");
  if (location !== undefined) formData.append("location", location || "");
  if (photoFile) formData.append("photo", photoFile);

  const res = await fetch(`${API_BASE}/api/posts/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return res.json();
};

export const getMyPosts = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/posts/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const updatePost = async (postId, { title, body, photoFile, location }) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  if (title !== undefined) formData.append("title", title);
  if (body !== undefined) formData.append("body", body);
  if (location !== undefined) formData.append("location", location);
  if (photoFile) formData.append("photo", photoFile);

  
  const res = await fetch(`${API_BASE}/api/posts/update/${postId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return res.json();
};

export const deletePost = async (postId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/posts/delete/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const likePost = async (postId) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/posts/like/${postId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const dislikePost = async (postId) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/posts/unlike/${postId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const commentPost = async (postId, text) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/posts/comment/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  return res.json();
};