import {
  POSTS_FETCH_FAIL,
  POSTS_FETCH_REQUEST,
  POSTS_FETCH_SUCCESS,
} from "../constants/postConstants";

const initialState = {
  posts: [],
  loading: false,
  error: null,
};

export const postReducer = (state = initialState, action) => {
  switch (action.type) {
    case POSTS_FETCH_REQUEST:
      return { ...state, loading: true, error: null };
    case POSTS_FETCH_SUCCESS:
      return { ...state, loading: false, posts: action.payload || [], error: null };
    case POSTS_FETCH_FAIL:
      return { ...state, loading: false, error: action.payload || "Unable to load posts" };
    default:
      return state;
  }
};
