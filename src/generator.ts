import axios from 'axios';
const API_URL = 'https://api.qr.io/v1';
const API_KEY = process.env.QR_API_KEY || '';

const createQRCode = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/create`, {
            apikey: API_KEY,
            data: data.url,
            title: data.title,
            transparent: "on",
            backcolor: "#ffffff",
            frontcolor: "#000000",
            marker_out_color: "#000000",
            marker_in_color: "#000000",
            pattern: "ellipse",
            marker: "sdoz",
            marker_in: "sdoz",
            optionlogo: "/images/watermarks/06-vcard.png",
            outer_frame: "balloon-bottom",
            framelabel: data.name,
            label_font: "Arial, Helvetica, sans-serif",
            custom_frame_color: "on",
            framecolor: "#000000"
        });
        return response.data.qrid;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const listQRCode = async (id) => {
    try {
        const response = await axios.post(`${API_URL}/list`, {
            apikey: API_KEY,
            pagination: "1"
        });
        const qrCodes = response.data[0].qr_codes;
        return qrCodes.find(qr => qr.qrid === id);
    } catch (error) {
        console.error(error);
        return null;
    }
};

const deleteQRCode = async (id) => {
    try {
        const response = await axios.post(`${API_URL}/delete`, {
            apikey: API_KEY,
            qrid: id
        });
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const QRCode = {
    create: createQRCode,
    get: listQRCode,
    delete: deleteQRCode
};

export default QRCode;
