let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const credentials = Buffer.from(
    `${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`
  ).toString("base64");

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope%2Fsell.account",
  });

  if (!res.ok) throw new Error(`eBay token error: ${await res.text()}`);

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;
  return cachedToken;
}

export async function getEbayMessages(itemId, buyerUsername) {
  const token = process.env.EBAY_USER_TOKEN; // OAuth user token (not app token)

  const res = await fetch(
    `https://api.ebay.com/post-order/v2/inquiry?item_id=${itemId}&buyer_username=${buyerUsername}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    }
  );

  if (!res.ok) {
    console.error(`[eBay] getMessages error: ${await res.text()}`);
    return [];
  }

  const data = await res.json();

  // Flatten message thread into simple array
  const messages = [];
  for (const thread of data?.inquirySearchResults ?? []) {
    for (const msg of thread?.messages ?? []) {
      messages.push({
        sender: msg.sender?.toUpperCase() === "BUYER" ? "BUYER" : "SELLER",
        text: msg.body ?? "",
        date: msg.creationDate,
      });
    }
  }

  return messages.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function replyEbayMessage(itemId, buyerUsername, text) {
  const token = process.env.EBAY_USER_TOKEN;

  const res = await fetch("https://api.ebay.com/post-order/v2/inquiry/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
    body: JSON.stringify({
      itemId,
      buyerUsername,
      message: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`[eBay] replyMessage error: ${await res.text()}`);
  }

  return true;
}

export function verifyEbayWebhook(req) {
  // Optional: verify eBay signature header for security
  // https://developer.ebay.com/api-docs/commerce/notification/overview.html
  return true;
}
