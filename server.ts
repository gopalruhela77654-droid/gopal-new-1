import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import PaytmChecksum from "paytmchecksum";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- Paytm Configuration ---
  // These should be set in the AI Studio Settings
  const PAYTM_MID = process.env.PAYTM_MID || "";
  const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY || "";
  const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE || "WEBSTAGING";
  const PAYTM_INDUSTRY_TYPE_ID = process.env.PAYTM_INDUSTRY_TYPE_ID || "Retail";
  const PAYTM_ENVIRONMENT = process.env.PAYTM_ENVIRONMENT || "STAGING"; // STAGING or PROD

  const PAYTM_HOST = PAYTM_ENVIRONMENT === "PROD" 
    ? "securegw.paytm.in" 
    : "securegw-stage.paytm.in";

  // --- API Routes ---

  // 1. Initiate Transaction
  app.post("/api/paytm/initiate", async (req, res) => {
    const { orderId, amount, customerId } = req.body;

    if (!PAYTM_MID || !PAYTM_MERCHANT_KEY) {
      return res.status(500).json({ 
        error: "Paytm credentials not configured in Settings." 
      });
    }

    const paytmParams: any = {};

    paytmParams.body = {
      requestType: "Payment",
      mid: PAYTM_MID,
      websiteName: PAYTM_WEBSITE,
      orderId: orderId,
      callbackUrl: `${process.env.APP_URL}/api/paytm/callback`,
      txnAmount: {
        value: amount.toString(),
        currency: "INR",
      },
      userInfo: {
        custId: customerId,
      },
    };

    try {
      const checksum = await PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        PAYTM_MERCHANT_KEY
      );

      paytmParams.head = {
        signature: checksum,
      };

      const post_data = JSON.stringify(paytmParams);

      const options = {
        hostname: PAYTM_HOST,
        port: 443,
        path: `/theia/api/v1/initiateTransaction?mid=${PAYTM_MID}&orderId=${orderId}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      let response = "";
      const post_req = https.request(options, (post_res) => {
        post_res.on("data", (chunk) => {
          response += chunk;
        });

        post_res.on("end", () => {
          const result = JSON.parse(response);
          res.json({ ...result, mid: PAYTM_MID });
        });
      });

      post_req.write(post_data);
      post_req.end();
    } catch (error) {
      console.error("Paytm Initiation Error:", error);
      res.status(500).json({ error: "Failed to initiate Paytm transaction" });
    }
  });

  // 2. Payment Callback
  app.post("/api/paytm/callback", async (req, res) => {
    const paytmParams = req.body;
    const paytmChecksum = paytmParams.CHECKSUMHASH;
    delete paytmParams.CHECKSUMHASH;

    const isVerifySignature = PaytmChecksum.verifySignature(
      paytmParams,
      PAYTM_MERCHANT_KEY,
      paytmChecksum
    );

    if (isVerifySignature) {
      console.log("Checksum Matched");
      // Redirect to success page or handle status
      if (paytmParams.STATUS === "TXN_SUCCESS") {
        res.send(`
          <html>
            <body>
              <script>
                window.location.href = "/?status=success&orderId=${paytmParams.ORDERID}";
              </script>
            </body>
          </html>
        `);
      } else {
        res.send(`
          <html>
            <body>
              <script>
                window.location.href = "/?status=failed&orderId=${paytmParams.ORDERID}";
              </script>
            </body>
          </html>
        `);
      }
    } else {
      console.log("Checksum Mismatched");
      res.send("Checksum Mismatched. Potential fraud detected.");
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
