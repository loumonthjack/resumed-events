import { AWS_ACCESS_KEY_ID, AWS_BUCKET_NAME, AWS_REGION, AWS_SECRET_ACCESS_KEY } from "../constants";
import AWS from 'aws-sdk';

export const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
});
export const uploadEventLogo = async (
    file: string | Buffer,
    type: string,
    eventId: string
) => {
    const params = {
        Bucket: AWS_BUCKET_NAME,
        Key: `logos/${eventId}.${type.split('/')[1]}`,
        ContentType: type,
        ContentEncoding: 'base64',
        Body: file,
    };
    const response = await s3.upload(params).promise();
    console.log(response);
    return response.Location;
};