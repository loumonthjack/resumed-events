export const getCookies = () => {
    const cookies = {};
    document.cookie.split(";").forEach((cookie) => {
        const [key, value] = cookie.split("=");
        cookies[key.trim()] = value;
    });
    return cookies;
};

export const cookieKeys = Object.keys(getCookies());