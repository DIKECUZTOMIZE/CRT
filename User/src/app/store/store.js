import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../../feature/Auth/state/auth.slice.js";
import locationReducer from "./location.slice.js";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        location: locationReducer,
    },
});
