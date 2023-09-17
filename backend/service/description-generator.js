require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);

const client = new OpenAI({
  apiKey: process.env.GPT3_API_KEY,
});
const frameInterval = 60;

// Function to generate descriptions for each frame
export const generateDescriptions = async (framesData) => {
  for (let i = 0; i < framesData.length; i += frameInterval) {
    const frame = framesData[i];

    // Convert the frame data to a text prompt
    const prompt = `Describe the scene: ${frame}`;

    // Generate a description using the OpenAI GPT-3 model
    try {
      const response = await client.completions.create({
        model: "text-davinci-002",
        prompt,
        max_tokens: 500,
      });

      const description = response.choices[0].text.trim();
      console.log(`Frame Description (${i + 1}): ${description}`);

      const title = await generateTitle(description);

      return { description, title };
    } catch (error) {
      console.error("Error generating description:", error);
    }
  }
};

async function generateTitle(description) {
  try {
    const response = await client.completions.create({
      model: "text-davinci-002",
      prompt: `Generate a title from the following description: ${description}`,
      max_tokens: 30, // Adjust the desired length of the title
    });

    const title = response.choices[0].text.trim();
    return title;
  } catch (error) {
    console.error("Error generating title:", error);
    return null;
  }
}
