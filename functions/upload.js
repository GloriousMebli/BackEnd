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

async function authenticate() {
  await b2.authorize();
  console.log('backBlazeInit Success')
}

async function uploadImage(fileBuffer, fileName) {
  try {

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

    const thumbnail = await imageResize(fileBuffer, '568x310')

    // Upload the file
    const thumbnailResponse = await b2.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName: fileName+'-thumbnail',
      data: thumbnail,
      mime: 'image/jpeg', // Adjust mime type accordingly
    });

    

    return { result: {response, thumbnailResponse} };
  } catch (error) {
    return { err: error }
  }
}

async function deleteImage(data) {
  try {
    // Delete the file version
    const deleteResponse = await b2.deleteFileVersion({
      fileName: data.fileName,
      fileId: data.fileId,
    });

    const deleteThumbnailResponse = await b2.deleteFileVersion({
      fileName: data.thumbnailFileName,
      fileId: data.thumbnailFileId,
    });

    console.log('File deleted successfully:', deleteResponse.data);
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('File deletion failed:', error);
    return { success: false, error };
  }
}

module.exports = { backBlazeInit: authenticate, uploadImage, deleteImage };
