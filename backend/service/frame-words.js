const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const tf = require("@tensorflow/tfjs-node");
const cocoSsd = require("@tensorflow-models/coco-ssd");
const fs = require("fs");
const fsPromise = require("fs/promises");

// Define the frame skip interval
const frameSkipInterval = 60;

let model = null;

// 1. Frame Extraction
const extractFrames = async (videoPath, outputDirectory) => {
  await ffmpeg.setFfmpegPath(ffmpegPath);
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(`${outputDirectory}/frame-%d.png`)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
};

// 2. Object Detection
const detectObjectsInFrame = async (frame) => {
  const image = tf.node.decodeImage(frame);
  if (model == null) {
    model = await cocoSsd.load();
  }
  const predictions = await model.detect(image);
  image.dispose();
  return predictions;
};

// 4. Process Frames
const processFramesInFolder = async (folderPath) => {
  const frames = fs.readdirSync(folderPath);
  const words = [];

  for (let i = 0; i < frames.length; i++) {
    if (frames[i].startsWith("frame-") && frames[i].endsWith(".png")) {
      if (i % frameSkipInterval === 0) {
        const frameName = frames[i];
        const framePath = path.join(folderPath, frameName);
        const frameBuffer = fs.readFileSync(framePath);

        try {
          console.time("detectObjectsInFrame");
          const detectedObjects = await detectObjectsInFrame(frameBuffer);
          console.timeEnd("detectObjectsInFrame");

          console.time("getWordsFromFrame");
          const descriptions = await getWordsFromFrame(detectedObjects);
          console.timeEnd("getWordsFromFrame");
          console.log(`Descriptions for ${frameName}:`);
          words.push(descriptions);
          descriptions.forEach((description, index) => {
            console.log(`Object ${index + 1}: ${description}`);
          });
        } catch (error) {
          console.error(`Error processing ${frameName}:`, error);
        }
      }
    }
  }
  return words;
};

// 5. Generate Descriptions for Detected Objects
const getWordsFromFrame = (objects) => {
  const words = objects.map((object) => object.class);
  return words;
};

export const getFrames = async (pathToVideo, videoId) => {
  const framePath = path.resolve(__dirname, "..", "..", "frames", videoId);

  try {
    await fsPromise.mkdir(framePath);
    await extractFrames(pathToVideo, framePath);
    return processFramesInFolder(framePath);
  } catch (error) {
    console.error("Error creating directory:", error);
    throw error;
  }
};
