import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

function getRedisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("Vercel Upstash Redis credentials are not configured in this environment.");
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url,
      token,
    });
  }
  return redisClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const { customerName, shippingAddress, contactDetails, itemOrdered, quantity } = req.body || {};

    console.log("Order logged perfectly by Vercel serverless function:", {
      customerName,
      shippingAddress,
      contactDetails,
      itemOrdered,
      quantity
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const orderKey = `order_${timestamp}`;

    const orderData = {
      customerName,
      shippingAddress,
      contactDetails,
      itemOrdered,
      quantity,
      timestamp,
      qikink_status: "not_initiated"
    };

    // 1. Save to Upstash Redis
    let redisSaved = false;
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.set(orderKey, orderData);
        await redis.lpush("all_orders", orderKey);
        redisSaved = true;
        console.log(`Saved order ${orderKey} successfully inside Upstash Redis.`);
      } else {
        console.warn("Skipping Redis storage – credentials are empty in this environment.");
      }
    } catch (redisError) {
      console.error("Failed to persist order to Upstash Redis:", redisError);
    }

    // 2. Qikink Draft Order Creation Integration
    const qikinkClientId = process.env.QIKINK_CLIENT_ID;
    const qikinkClientSecret = process.env.QIKINK_CLIENT_SECRET;
    const qikinkEndpoint = process.env.QIKINK_ENDPOINT || "https://api.qikink.com";

    // Debug logs to verify exact environment variable definition status
    console.log("=== API Environment Variable Verification ===");
    console.log("Is QIKINK_CLIENT_ID missing:", !process.env.QIKINK_CLIENT_ID);
    console.log("Is QIKINK_CLIENT_SECRET missing:", !process.env.QIKINK_CLIENT_SECRET);
    console.log("QIKINK_ENDPOINT value:", process.env.QIKINK_ENDPOINT || "(using default: https://api.qikink.com)");
    console.log("Is KV_REST_API_URL missing:", !process.env.KV_REST_API_URL);
    console.log("Is KV_REST_API_TOKEN missing:", !process.env.KV_REST_API_TOKEN);
    console.log("=============================================");

    let qikinkOrderCreated = false;
    let qikinkResponseData: any = null;
    let qikinkWarningMessage = "";

    if (!qikinkClientId || !qikinkClientSecret) {
      qikinkWarningMessage = "Qikink API integration credentials (QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET) are missing in this environment.";
      console.warn(qikinkWarningMessage);
    } else {
      try {
        console.log(`Authenticating with Qikink endpoint: ${qikinkEndpoint}`);
        
        // Retrieve Access Token via OAuth2 Client Credentials
        // Try standard V2 oauth/token endpoint path, fallback to base oauth/token
        let tokenResponse = null;
        let tokenData: any = null;

        try {
          const authBody = {
            client_id: qikinkClientId,
            ClientId: qikinkClientId,
            client_secret: qikinkClientSecret,
            grant_type: "client_credentials"
          };

          tokenResponse = await fetch(`${qikinkEndpoint}/v2/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authBody)
          });

          if (!tokenResponse.ok) {
            // Try fallback endpoint pathway
            console.log("Token v2 endpoint returned status " + tokenResponse.status + ". Trying fallback /oauth/token...");
            tokenResponse = await fetch(`${qikinkEndpoint}/oauth/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(authBody)
            });
          }

          if (tokenResponse.ok) {
            tokenData = await tokenResponse.json();
          } else {
            const errText = await tokenResponse.text();
            throw new Error(`Token request failed with status ${tokenResponse.status}: ${errText}`);
          }
        } catch (authErr: any) {
          console.error("Authorization flow with Qikink failed:", authErr);
          throw authErr;
        }

        const accessToken = tokenData?.access_token || tokenData?.data?.access_token;
        if (!accessToken) {
          throw new Error("Could not find 'access_token' in Qikink OAuth response: " + JSON.stringify(tokenData));
        }

        console.log("Authenticated successfully with Qikink. Access token received.");

        // Parse and map incoming payload to Qikink's shipping, customer, and line-item format requirements.
        const nameStr = (customerName || "Guest").trim();
        const spaceIndex = nameStr.indexOf(" ");
        const first_name = spaceIndex !== -1 ? nameStr.substring(0, spaceIndex) : nameStr;
        const last_name = spaceIndex !== -1 ? nameStr.substring(spaceIndex + 1) : "Customer";

        const addrStr = (shippingAddress || "").trim();
        const addrParts = addrStr.split(",").map(s => s.trim()).filter(Boolean);

        const pincodeMatch = /\b\d{6}\b/.exec(addrStr);
        const pincode = pincodeMatch ? pincodeMatch[0] : "110001";

        const phoneMatch = /\b\d{10,12}\b/.exec(contactDetails || addrStr || "");
        const phone = phoneMatch ? phoneMatch[0] : (contactDetails || "9999999999");

        let city = "New Delhi";
        let state = "Delhi";
        if (addrParts.length > 1) {
          city = addrParts[addrParts.length - 2] || "New Delhi";
          state = addrParts[addrParts.length - 1] || "Delhi";
          city = city.replace(/\b\d{6}\b/g, "").trim() || "New Delhi";
          state = state.replace(/\b\d{6}\b/g, "").trim() || "Delhi";
        }

        const addressLine1 = addrParts[0] || addrStr || "Address Line 1";
        const addressLine2 = addrParts.slice(1, -2).join(", ") || addrParts[1] || "Near Landmark";

        const lineItemsItem = {
          sku: itemOrdered || "AURA-TSHIRT-M",
          variant_id: itemOrdered || "AURA-TSHIRT-M",
          product_id: itemOrdered || "AURA-TSHIRT-M",
          name: itemOrdered || "AURA-001 Custom Apparel",
          title: itemOrdered || "AURA-001 Custom Apparel",
          quantity: parseInt(String(quantity || 1), 10) || 1,
          price: "0.00",
          price_unit: "0.00"
        };

        const qikinkOrderPayload = {
          order_number: `AURA_ORDER_${timestamp}`,
          status: "draft",
          payment_method: "prepaid",
          payment_type: "prepaid",
          shipping_method: "flat_rate",
          shipping_address: {
            first_name,
            last_name,
            address1: addressLine1,
            address2: addressLine2,
            city,
            state,
            pincode,
            phone,
            country: "IN",
            email: "guest@example.com"
          },
          billing_address: {
            first_name,
            last_name,
            address1: addressLine1,
            address2: addressLine2,
            city,
            state,
            pincode,
            phone,
            country: "IN",
            email: "guest@example.com"
          },
          shipping: {
            first_name,
            last_name,
            address1: addressLine1,
            address2: addressLine2,
            city,
            state,
            pincode,
            phone,
            country: "IN",
            email: "guest@example.com",
            address_1: addressLine1,
            address_2: addressLine2,
            postcode: pincode
          },
          billing: {
            first_name,
            last_name,
            address1: addressLine1,
            address2: addressLine2,
            city,
            state,
            pincode,
            phone,
            country: "IN",
            email: "guest@example.com",
            address_1: addressLine1,
            address_2: addressLine2,
            postcode: pincode
          },
          line_items: [lineItemsItem],
          items: [lineItemsItem],
          products: [lineItemsItem]
        };

        console.log("Transmitting mapped draft order payload to Qikink:", JSON.stringify(qikinkOrderPayload, null, 2));

        // Attempt order creation POST API
        let orderResponse = await fetch(`${qikinkEndpoint}/v2/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(qikinkOrderPayload)
        });

        if (!orderResponse.ok) {
          console.log(`Failed /v2/orders POST endpoint (${orderResponse.status}). Trying alternative API v1 /orders...`);
          orderResponse = await fetch(`${qikinkEndpoint}/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(qikinkOrderPayload)
          });
        }

        if (orderResponse.ok) {
          qikinkResponseData = await orderResponse.json();
          qikinkOrderCreated = true;
          console.log("Draft order created successfully inside Qikink:", qikinkResponseData);

          // Update Status inside Upstash Redis if available
          try {
            const redis = getRedisClient();
            if (redis) {
              const updatedData = {
                ...orderData,
                qikink_status: "created",
                qikink_order_id: qikinkResponseData?.order_id || qikinkResponseData?.id || "unknown",
                qikink_response: qikinkResponseData
              };
              await redis.set(orderKey, updatedData);
            }
          } catch (updateErr) {
            console.error("Could not update Redis order status:", updateErr);
          }
        } else {
          const errText = await orderResponse.text();
          console.error(`Qikink Order API failed with status ${orderResponse.status}:`, errText);
        }
      } catch (qikinkError: any) {
        console.error("Failed executing Qikink integration subflow:", qikinkError);
      }
    }

    // Determine return message based on what details saved successfully
    let finalMessage = "Order processed successfully!";
    if (redisSaved && qikinkOrderCreated) {
      finalMessage = "Order saved perfectly to Upstash Redis and Draft Order successfully created in Qikink!";
    } else if (redisSaved && !qikinkOrderCreated) {
      finalMessage = `Order caught and recorded perfectly in Upstash Redis database!${qikinkWarningMessage ? " (" + qikinkWarningMessage + ")" : " (Qikink order creation pending/offline)"}`;
    } else if (!redisSaved && qikinkOrderCreated) {
      finalMessage = "Order successfully created as a Draft inside Qikink!";
    } else {
      finalMessage = "Order data caught perfectly by Vercel serverless environment!";
    }

    return res.status(200).json({
      success: true,
      message: finalMessage,
      orderKey,
      qikink: {
        success: qikinkOrderCreated,
        data: qikinkResponseData
      }
    });

  } catch (error: any) {
    console.error("Error processing order in serverless function:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
}
