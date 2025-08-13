import { google } from "googleapis";
import getGeminiModel from "../lib/gemini";
import googleAPIAuth from "../lib/google";
import catchAsyncError from "../utils/catchAsync";
import sendResponse from "../utils/send.response";

const sendMessageReply = catchAsyncError(async (req, res) => {
  const { query } = req.body;
  const docId = "1QoP4oJE-2NAqk7Y7bgDWmAfiN3Fg9UfadcZJ0qzazOY"; // Your Google Doc ID

  // Ensure googleAPIAuth is initialized before making requests
  // If you're using a service account or OAuth2, you might need to await getClient()
  const docs = google.docs({ version: "v1", auth: googleAPIAuth });

  const result = await docs.documents.get({ documentId: docId });
  const content = result.data.body?.content || [];

  let text = "";
  for (const item of content) {
    if (item.paragraph && item.paragraph.elements) {
      for (const elem of item.paragraph.elements) {
        if (elem.textRun) {
          text += elem.textRun.content;
        }
      }
    }
  }

  // Trim the text and assign it back
  text = text.trim();

  const prompt = `
You are a helpful assistant specialized in providing detailed information based *only* on the provided business document.
If the answer is not directly available in the document, state that clearly and do not make up information.
Always strive to give a comprehensive and descriptive answer using the content of the document. if you can't find the answer in the document, respond with "I'm sorry, I can't help you at this moment out agent will get back to you."

Business Document:
"""
${text}
"""

User Question: ${query}

Helpful Assistant's Answer:
`;
  const model = getGeminiModel(); // Get the initialized Gemini model (e.g., gemini-pro)

  let geminiResponseText = "Could not generate a response."; // Default message

  try {
    const geminiResult = await model.generateContent(prompt); // Await the result
    const response = await geminiResult.response;
    geminiResponseText = response.text(); // Extract the text from Gemini's response
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    // You might want to send a more specific error message to the client here
    geminiResponseText = "Error processing your request with the AI model.";
  }

  // Send the Gemini-generated response back to the client
  sendResponse(res, {
    message: "Message processed successfully.",
    statusCode: 200,
    success: true,
    data: geminiResponseText, // Send Gemini's response
  });
});

const chatController = {
  sendMessageReply,
};

export default chatController;
