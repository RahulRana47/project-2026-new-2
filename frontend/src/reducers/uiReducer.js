import { SET_LOCATION_FILTER } from "../constants/uiConstants";

const initialState = {
  locationFilter: "",
};

export const uiReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_LOCATION_FILTER:
      return { ...state, locationFilter: action.payload };
    default:
      return state;
  }
};
