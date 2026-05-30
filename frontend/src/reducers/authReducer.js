import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOAD_USER_REQUEST,
  LOAD_USER_SUCCESS,
  LOAD_USER_FAIL,
  LOGOUT,
  CLEAR_AUTH_ERROR,
} from "../constants/authConstants";

const initialState = {
  token: null,
  user: null,
  loading: false,
  error: null,
};

export const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
    case LOAD_USER_REQUEST:
      return { ...state, loading: true, error: null };

    case LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        token: action.payload.token,
        user: action.payload.user || null,
        error: null,
      };

    case LOAD_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload,
        error: null,
      };

    case LOGIN_FAIL:
    case LOAD_USER_FAIL:
      return { ...state, loading: false, error: action.payload };

    case CLEAR_AUTH_ERROR:
      return { ...state, error: null };

    case LOGOUT:
      return { ...initialState, token: null };

    default:
      return state;
  }
};
