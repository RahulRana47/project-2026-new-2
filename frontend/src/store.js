import { applyMiddleware, createStore } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";
import { thunk } from "redux-thunk";
import rootReducer from "./reducers";

const middleware = [thunk];

const rawToken = localStorage.getItem("token");
const tokenFromStorage =
  rawToken && rawToken !== "undefined" && rawToken !== "null" ? rawToken : null;

const initialState = {
  auth: {
    token: tokenFromStorage || null,
    user: null,
    loading: false,
    error: null,
  },
  post: {
    posts: [],
    loading: false,
    error: null,
  },
  ui: {
    locationFilter: "",
  },
};

const store = createStore(
  rootReducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;
