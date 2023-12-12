import { User } from "@prisma/client";
import axios from "axios";
import { FULL_SERVER_URL } from "../../src/server/constants";

let DEFAULT_IMAGE = "https://s3.amazonaws.com/app.local.resumed.website/profile_pics/default.png";
let userInfo: User | null = null;
const getUser = (key, token) => {
    // include auth token in header
    const request = axios.get(FULL_SERVER_URL + "operation/getUser", {
        headers: {
            Authorization: `Bearer ${token}`,
            Cookie: `${key}=${token}`,
        },
        withCredentials: true,
    });
    const result = request.then(response => {
        if (response.data.user.profilePicture)
            DEFAULT_IMAGE = response.data.user.profilePicture;
        userInfo = response.data.user;
        return response.data;
    });
    console.log("getUser", result);
    return result;
}

export { DEFAULT_IMAGE, userInfo, getUser };