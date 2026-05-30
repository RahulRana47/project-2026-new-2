import { getPosts } from "../services/api";
import {
  POSTS_FETCH_FAIL,
  POSTS_FETCH_REQUEST,
  POSTS_FETCH_SUCCESS,
} from "../constants/postConstants";

// Fetch and cache posts for the dashboard/state views
export const fetchPosts = () => async (dispatch, getState) => {
  const state = getState();
  const alreadyLoading = state?.post?.loading;
  const havePosts = Array.isArray(state?.post?.posts) && state.post.posts.length > 0;

  // Avoid duplicate network calls when we already have data or are loading
  if (alreadyLoading || havePosts) return;

  dispatch({ type: POSTS_FETCH_REQUEST });

  try {
    const res = await getPosts(1, 200);
    const incoming = Array.isArray(res?.posts) ? res.posts : [];

    // Sort newest first as required
    const sorted = [...incoming].sort((a, b) => {
      const aDate = new Date(a?.createdAt || 0).getTime();
      const bDate = new Date(b?.createdAt || 0).getTime();
      return bDate - aDate;
    });

    dispatch({
      type: POSTS_FETCH_SUCCESS,
      payload: sorted,
    });
  } catch (error) {
    dispatch({
      type: POSTS_FETCH_FAIL,
      payload: error?.message || "Failed to load posts",
    });
  }
};
