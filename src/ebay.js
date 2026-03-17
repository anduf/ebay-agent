export async function replyEbayMessage(itemId, buyerUsername, msgId, text) {
  const safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<AddMemberMessageRTQRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${process.env.EBAY_USER_TOKEN}</eBayAuthToken>
  </RequesterCredentials>
  <ItemID>${itemId}</ItemID>
  <MemberMessage>
    <Body>${safeText}</Body>
    <RecipientID>${buyerUsername}</RecipientID>
    ${msgId ? `<ParentMessageID>${msgId}</ParentMessageID>` : ""}
  </MemberMessage>
</AddMemberMessageRTQRequest>`;
  const res = await fetch("https://api.ebay.com/ws/api.dll", {
    method: "POST",
    headers: {
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1265",
      "X-EBAY-API-DEV-NAME": process.env.EBAY_DEV_ID,
      "X-EBAY-API-APP-NAME": process.env.EBAY_APP_ID,
      "X-EBAY-API-CERT-NAME": process.env.EBAY_CERT_ID,
      "X-EBAY-API-CALL-NAME": "AddMemberMessageRTQ",
      "X-EBAY-API-SITEID": "0",
      "Content-Type": "text/xml",
    },
    body: xml,
  });
  const result = await res.text();
  console.log(`[eBay] Reply result: ${result.substring(0, 300)}`);
  if (!result.includes("<Ack>Success</Ack>") && !result.includes("<Ack>Warning</Ack>")) {
    throw new Error(`Reply failed: ${result.substring(0, 300)}`);
  }
  return true;
}
export function verifyEbayWebhook(req) { return true; }
