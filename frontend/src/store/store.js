import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import notificationSlice from "./notificationSlice";

const store = configureStore({
    reducer:{
        auth : authSlice,
        notifications: notificationSlice
    }
});

export default store;