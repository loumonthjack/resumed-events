import { User } from "@prisma/client";
import axios from "axios";

let DEFAULT_IMAGE = "https://s3.amazonaws.com/app.local.resumed.website/profile_pics/default.png";
let userInfo: User | null = null;
const getUser = (key, token) => {
    // include auth token in header
    const request = axios.post("http://localhost:4000/operation/getUser", {
        Cookie: key + "=" + token + ";",
    });
    const result = request.then(response => {
        if (response.data.user.profilePicture)
            DEFAULT_IMAGE = response.data.user.profilePicture;
        userInfo = response.data.user;
        return response.data;
    });
    return result;
}

export { DEFAULT_IMAGE, userInfo, getUser };