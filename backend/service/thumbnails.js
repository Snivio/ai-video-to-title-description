const ffmpeg = require("fluent-ffmpeg");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

export const generateThumbnails = (inputVideo, res) => {
  if (!fs.existsSync(inputVideo)) {
    return res.status(404).send("Video file not found");
  }

  // Extract the first 10 digits from the video file name
  const videoFileName = inputVideo.split("/").pop(); // Get the file name from the path
  const first10Digits = videoFileName.match(/\d{10}/);

  if (!first10Digits) {
    return res.status(400).send("Video file name does not contain 10 digits");
  }

  const frameDirectory = path.resolve(
    __dirname,
    "..",
    "..",
    "frames",
    first10Digits[0]
  );

  // Delete existing frames in the specified directory
  fs.rmdirSync(frameDirectory, { recursive: true }, (err) => {
    if (err) {
      console.error("Error deleting frames:", err);
    }
  });

  // Create the directory if it doesn't exist
  fs.mkdirSync(frameDirectory, { recursive: true });

  const tempOutputFile = `${frameDirectory}/temp_thumbnail.jpg`;

  ffmpeg()
    .input(inputVideo)
    .seekInput(5)
    .frames(1)
    .output(tempOutputFile)
    .on("end", (stdout, stderr) => {
      sharp(tempOutputFile)
        .resize(320, 240)
        .toBuffer((err, data) => {
          if (err) {
            console.error("Error generating thumbnail:", err);
            res.status(500).send("Error generating thumbnail");
          } else {
            // Clean up the temporary output file
            fs.unlinkSync(tempOutputFile);

            // Encode the thumbnail image in base64 format
            const base64Thumbnail = data.toString("base64");

            // Send the base64-encoded image as a JSON response
            res.json({ thumbnail: base64Thumbnail });
          }
        });
    })
    .on("error", (err) => {
      console.error("Error generating thumbnail:", err);
      res.status(500).send("Error generating thumbnail");
    })
    .run();
};
