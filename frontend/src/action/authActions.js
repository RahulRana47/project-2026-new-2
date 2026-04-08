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
import { getMe, loginUser } from "../services/api";

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });

    const res = await loginUser({ email, password });

    if (res?.token) {
      localStorage.setItem("token", res.token);

      dispatch({
        type: LOGIN_SUCCESS,
        payload: { token: res.token, user: res.user || null },
      });

      // Fetch user profile if not returned with token
      if (!res.user) {
        dispatch(loadUser());
      }
    } else {
      dispatch({
        type: LOGIN_FAIL,
        payload: res?.message || "Invalid email or password",
      });
    }
  } catch (err) {
    dispatch({
      type: LOGIN_FAIL,
      payload: err?.message || "Unable to login. Please try again.",
    });
  }
};

export const loadUser = () => async (dispatch, getState) => {
  try {
    const token = getState().auth.token || localStorage.getItem("token");
    if (!token) {
      dispatch({ type: LOAD_USER_FAIL, payload: "No token found" });
      return;
    }

    dispatch({ type: LOAD_USER_REQUEST });

    const res = await getMe(token);

    if (res?.status === 401 || res?.status === 403) {
      localStorage.removeItem("token");
      dispatch({ type: LOGOUT });
      dispatch({
        type: LOAD_USER_FAIL,
        payload: "Session expired. Please login again.",
      });
      return;
    }

    if (res?.success && res?.user) {
      try {
        localStorage.setItem("avatar", res.user.avatar || "");
      } catch (e) {}
      dispatch({ type: LOAD_USER_SUCCESS, payload: res.user });
    } else {
      dispatch({
        type: LOAD_USER_FAIL,
        payload: res?.message || "Unable to load user",
      });
    }
  } catch (err) {
    dispatch({
      type: LOAD_USER_FAIL,
      payload: err?.message || "Unable to load user",
    });
  }
};

export const logout = () => (dispatch) => {
  localStorage.removeItem("token");
  dispatch({ type: LOGOUT });
};

export const clearAuthError = () => ({ type: CLEAR_AUTH_ERROR });
