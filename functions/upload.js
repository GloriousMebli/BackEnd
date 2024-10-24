// upload.js
const fs = require('fs');
const BackblazeB2 = require('backblaze-b2');
const config = require('../config/bb');

// Initialize Backblaze B2
const b2 = new BackblazeB2({
  applicationKeyId: config.applicationKeyId,
  applicationKey: config.applicationKey,
});



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

    console.log('File uploaded successfully:', response.data);
    const publicUrl = config.publicUrl + response.data.fileName;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

module.exports = uploadImage;