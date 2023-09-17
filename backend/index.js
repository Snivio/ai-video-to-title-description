const { getFrames } = require("./service/frame-words");
const { generateDescriptions } = require("./service/description-generator");
const express = require("express");
const { getTopKeywords } = require("./service/keywords");
const { generateThumbnails } = require("./service/thumbnails");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");

const app = express();
const port = 4000;

app.use(cors());
app.use(fileUpload());

app.post("/", async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      // No files were uploaded
      return res.status(400).send("No files were uploaded.");
    }
    const uploadedFile = req.files.file;

    const date = new Date();

    const epochTimeInSeconds = parseInt(date.getTime() / 1000).toString();

    const pathToVideo = path.resolve(
      __dirname,
      "..",
      "video-samples",
      `${epochTimeInSeconds}-${uploadedFile.name}`
    );

    uploadedFile.mv(pathToVideo, async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }

      // Now you can process the file, generate descriptions, etc.
      const wordsArray = await getFrames(pathToVideo, epochTimeInSeconds);
      console.log(wordsArray);
      const { description, title } = await generateDescriptions(wordsArray);

      // Return the description as the response
      res.send({
        description,
        keyWords: getTopKeywords(wordsArray),
        title,
        name: `${epochTimeInSeconds}-${uploadedFile.name}`,
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/thumbnail/:name", (req, res) => {
  let name = req.params.name;
  const pathToVideo = path.resolve(__dirname, "..", "video-samples", name);
  generateThumbnails(pathToVideo, res);
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
