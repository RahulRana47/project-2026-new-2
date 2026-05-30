import { SET_LOCATION_FILTER } from "../constants/uiConstants";

export const setLocationFilter = (value) => ({
  type: SET_LOCATION_FILTER,
  payload: value || "",
});
