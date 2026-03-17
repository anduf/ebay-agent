import express from "express";
import { handleIncomingMessage } from "./agent.js";
import { replyEbayMessage } from "./ebay.js";

const app = express();
app.use(express.json());
app.use(express.text({ type: ["text/xml", "application/xml", "text/*"] }));

app.get("/webhook/ebay", async (req, res) => {
  const challenge = req.query.challenge_code;
  if (!challenge) return res.status(400).send("Missing challenge_code");
  const crypto = await import("crypto");
  const protocol = req.get("x-forwarded-proto") || "https";
  const host = req.get("host");
  const endpoint = `${protocol}://${host}${req.path}`;
  console.log(`[Verification] challenge=${challenge} endpoint=${endpoint}`);
  const hash = crypto.createHash("sha256").update(challenge + process.env.EBAY_VERIFICATION_TOKEN + endpoint).digest("hex");
  res.json({ challengeResponse: hash });
});

app.post("/webhook/ebay", async (req, res) => {
  res.sendStatus(200);
  try {
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    console.log("[Webhook] Received:", rawBody.substring(0, 800));
    const itemId = rawBody.match(/<ItemID>([^<]+)<\/ItemID>/)?.[1];
    const senderID = rawBody.match(/<SenderID>([^<]+)<\/SenderID>/)?.[1];
    const msgBody = rawBody.match(/<Body>([\s\S]*?)<\/Body>/)?.[1]?.trim();
    const msgId = rawBody.match(/<MsgID>([^<]+)<\/MsgID>/)?.[1];
    console.log(`[Webhook] itemId=${itemId} sender=${senderID} msgId=${msgId}`);
    if (!itemId || !senderID || !msgBody) { console.log("[Webhook] Missing fields"); return; }
    const history = [{ role: "user", content: msgBody }];
    const reply = await handleIncomingMessage(history);
    console.log(`[Claude] Reply: ${reply}`);
    await replyEbayMessage(itemId, senderID, msgId, reply);
    console.log(`[eBay] Reply sent to ${senderID}`);
  } catch (err) { console.error("[Webhook Error]", err.message); }
});

app.get("/", (req, res) => res.json({ status: "ok", agent: "eBay MacBook Sales Agent" }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
