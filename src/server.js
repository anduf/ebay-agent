import express from "express";
import { handleIncomingMessage } from "./agent.js";
import { verifyEbayWebhook, getEbayMessages, replyEbayMessage } from "./ebay.js";

const app = express();
app.use(express.json());

// eBay webhook verification (required on setup)
app.get("/webhook/ebay", async (req, res) => {
  const challenge = req.query.challenge_code;
  if (!challenge) return res.status(400).send("Missing challenge_code");

  const crypto = await import("crypto");
  const hash = crypto
    .createHash("sha256")
    .update(challenge + process.env.EBAY_VERIFICATION_TOKEN + process.env.WEBHOOK_ENDPOINT)
    .digest("hex");

  res.json({ challengeResponse: hash });
});

// eBay webhook — receives new message notifications
app.post("/webhook/ebay", async (req, res) => {
  res.sendStatus(200); // acknowledge immediately

  try {
    const notification = req.body;
    const topic = notification?.metadata?.topic;

    if (topic !== "BUYER_MESSAGING_BUYER_MESSAGE_CREATED") return;

    const itemId = notification?.data?.itemId;
    const buyerUsername = notification?.data?.buyerUsername;

    if (!itemId || !buyerUsername) return;

    // Fetch full message thread
    const messages = await getEbayMessages(itemId, buyerUsername);
    if (!messages?.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === "SELLER") return; // avoid self-reply loop

    const buyerText = lastMessage.text;
    console.log(`[eBay] Message from ${buyerUsername}: ${buyerText}`);

    // Build conversation history for Claude
    const history = messages.map((m) => ({
      role: m.sender === "BUYER" ? "user" : "assistant",
      content: m.text,
    }));

    // Get Claude's response
    const reply = await handleIncomingMessage(history);
    console.log(`[Claude] Reply: ${reply}`);

    // Send reply back via eBay API
    await replyEbayMessage(itemId, buyerUsername, reply);
    console.log(`[eBay] Reply sent to ${buyerUsername}`);
  } catch (err) {
    console.error("[Webhook Error]", err.message);
  }
});

// Health check
app.get("/", (req, res) => res.json({ status: "ok", agent: "eBay MacBook Sales Agent" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
