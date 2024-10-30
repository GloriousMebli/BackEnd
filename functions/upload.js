// upload.js
const fs = require('fs');
const BackblazeB2 = require('backblaze-b2');
const config = require('../config/bb');
const sharp = require('sharp')
// Initialize Backblaze B2
const b2 = new BackblazeB2({
  applicationKeyId: config.applicationKeyId,
  applicationKey: config.applicationKey,
});

const imageResize = async (imageData, imageSize) => {
  return await new Promise((resolve, reject) => {
    const size = imageSize.split('x')
    try {
      sharp(imageData, { failOnError: false })
        .resize(1 * size[0], 1 * size[1])
        .withMetadata()
        .toBuffer((err, data, info) => {
          if (err) {
            reject(err)
          }
          resolve(data)
        })
    } catch (e) {
      console.error(e)
      reject(e)
    }
  })
}


async function uploadImage(fileBuffer, fileName) {
  try {
    
    // Authorize with Backblaze B2
    await b2.authorize();

    // Get an upload URL
    const uploadUrl = await b2.getUploadUrl({ bucketId: config.bucketId });


    // Upload the file
    const response = await b2.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName: fileName,
      data: fileBuffer,
      mime: 'image/jpeg', // Adjust mime type accordingly
    });

    const publicUrl = config.publicUrl + response.data.fileName;

    const thumbnail = await imageResize(fileBuffer, '568x310')


    // Upload the file
    const thumbnailResponse = await b2.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName: fileName+'-thumbnail',
      data: thumbnail,
      mime: 'image/jpeg', // Adjust mime type accordingly
    });

    const thumbnailUrl = config.publicUrl + thumbnailResponse.data.fileName;

    return { publicUrl, thumbnailUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

module.exports = uploadImage;