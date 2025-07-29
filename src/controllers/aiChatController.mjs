// backend/controllers/aiChatController.mjs
import { google } from "@ai-sdk/google";
import { streamText } from "ai"; // Remove toDataStream import
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productInfoPath = path.join(__dirname, "../../", "product-knowledge.txt");
const productInfo = await fs.readFile(productInfoPath, "utf-8");

export async function streamChat(req, res) {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'messages' array" });
    }

    const result = await streamText({
      model: google("models/gemini-2.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      system: `
        You are a helpful assistant for a Teacher SaaS product.
        Only answer based on this context:
        ${productInfo}
        If asked anything unrelated, say:
        "Sorry, I can only answer questions about our Teacher SaaS platform."
      `,
      messages,
    });

    const response = result.toDataStreamResponse();

    if (response.body) {
      // Set headers
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");

      // Pipe the response body
      const reader = response.body.getReader();

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (error) {
          console.error("Stream error:", error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Stream error" });
          } else {
            res.end();
          }
        }
      };

      await pump();
    }
  } catch (err) {
    console.error("AI Stream Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.end();
    }
  }
}
