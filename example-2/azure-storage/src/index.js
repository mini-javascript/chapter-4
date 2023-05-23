const express = require("express");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  newPipeline,
} = require("@azure/storage-blob");

const app = express();

//
// Throws an error if the any required environment variables are missing.
//

if (!process.env.PORT) {
  throw new Error(
    "Please specify the port number for the HTTP server with the environment variable PORT."
  );
}

if (!process.env.STORAGE_ACCOUNT_NAME) {
  throw new Error(
    "Please specify the name of an Azure storage account in environment variable STORAGE_ACCOUNT_NAME."
  );
}

if (!process.env.STORAGE_ACCESS_KEY) {
  throw new Error(
    "Please specify the access key to an Azure storage account in environment variable STORAGE_ACCESS_KEY."
  );
}

//
// Extracts environment variables to globals for convenience.
//

const PORT = process.env.PORT;
const sharedKeyCredential = new StorageSharedKeyCredential(
  process.env.AZURE_STORAGE_ACCOUNT_NAME,
  process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY
);

const pipeline = newPipeline(sharedKeyCredential);

const blobServiceClient = new BlobServiceClient(
  `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  pipeline
);

const getBlobName = (originalName) => {
  // Use a random number to generate a unique file name,
  //  removing "0." from the start of the string.
  const identifier = Math.random().toString().replace(/0\./, "");
  return `${identifier}-${originalName}`;
};

//
// Registers a HTTP GET route to retrieve videos from storage.
//
app.get("/video/:filename", async (req, res) => {
  let viewData;

  try {
    const blobName = req.params.filename;
    const containerClient = blobServiceClient.getContainerClient("videos");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Type", "video/mp4");
    const blobClient = await containerClient.getBlobClient(blobName);

    const downloadResponse = await blobClient.download();
    downloadResponse.readableStreamBody.pipe(res);
  } catch (err) {
    viewData = {
      title: "Error",
      viewName: "error",
      message: "There was an error contacting the blob storage container.",
      error: err,
    };
    res.status(500);
  }
});
//
// Starts the HTTP server.
//
app.listen(PORT, () => {
  console.log(`Microservice online`);
});
