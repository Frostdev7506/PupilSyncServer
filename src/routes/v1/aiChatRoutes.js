const express = require("express");
const router = express.Router();

// Don't import the controller at the top
let controllerLoaded = false;
let streamChatFn;

async function loadController() {
  if (!controllerLoaded) {
    const module = await import("../../controllers/aiChatController.mjs");
    streamChatFn = module.streamChat;
    controllerLoaded = true;
  }
}

// Route handler
router.post("/chat", async (req, res, next) => {
  try {
    await loadController();
    return streamChatFn(req, res);
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
