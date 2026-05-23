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

    if (!qikinkClientId || !qikinkClientSecret) {
      throw new Error("Qikink API integration credentials (QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET) are missing or empty in this environment.");
    }

    console.log(`Authenticating with Qikink endpoint: ${qikinkEndpoint}`);
    
    // Retrieve Access Token via Qikink's official Token/Session endpoints
    let accessToken: string | null = null;
    let tokenData: any = null;

    const endpointsToTry = [
      '/v2/oauth/token',
      '/oauth/token',
      '/v2/token',
      '/v2/session-request',
      '/v2/session',
      '/session-request',
      '/session',
      '/oauth2/token',
      '/v2/oauth2/token'
    ];

    console.log("=== Initiating Deep Qikink Token Discovery/Authentication ===");

    for (const path of endpointsToTry) {
      const targetUrl = `${qikinkEndpoint}${path}`;
      
      // Attempt 1: JSON body
      try {
        console.log(`[Auth Variant JSON] Attempting POST to ${targetUrl}`);
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: qikinkClientId,
            ClientId: qikinkClientId,
            client_secret: qikinkClientSecret,
            grant_type: "client_credentials"
          })
        });

        const text = await res.text();
        console.log(`[JSON Response] Endpoints ${path} returned status ${res.status}: ${text}`);

        if (res.ok) {
          try {
            const parsed = JSON.parse(text);
            const tokenCandidate = parsed?.access_token || parsed?.data?.access_token || parsed?.token || parsed?.data?.token || parsed?.sessionId || parsed?.data?.sessionId || parsed?.session_id;
            if (tokenCandidate) {
              tokenData = parsed;
              accessToken = tokenCandidate;
              console.log(`Successfully obtained token from JSON variant of ${path}: ${accessToken}`);
              break;
            }
          } catch (e) {
            console.log(`Failed to parse response JSON from ${path}:`, e);
          }
        }
      } catch (err) {
        console.error(`Error executing JSON variant on ${path}:`, err);
      }

      // Attempt 2: Form URL Encoded body
      try {
        console.log(`[Auth Variant Urlencoded] Attempting POST to ${targetUrl}`);
        const urlencoded = new URLSearchParams();
        urlencoded.append('client_id', qikinkClientId);
        urlencoded.append('ClientId', qikinkClientId);
        urlencoded.append('client_secret', qikinkClientSecret);
        urlencoded.append('grant_type', 'client_credentials');

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: urlencoded.toString()
        });

        const text = await res.text();
        console.log(`[Urlencoded Response] Endpoints ${path} returned status ${res.status}: ${text}`);

        if (res.ok) {
          try {
            const parsed = JSON.parse(text);
            const tokenCandidate = parsed?.access_token || parsed?.data?.access_token || parsed?.token || parsed?.data?.token || parsed?.sessionId || parsed?.data?.sessionId || parsed?.session_id;
            if (tokenCandidate) {
              tokenData = parsed;
              accessToken = tokenCandidate;
              console.log(`Successfully obtained token from Urlencoded variant of ${path}: ${accessToken}`);
              break;
            }
          } catch (e) {
            console.log(`Failed to parse response JSON from Urlencoded ${path}:`, e);
          }
        }
      } catch (err) {
        console.error(`Error executing Urlencoded variant on ${path}:`, err);
      }

      // Attempt 3: Passing credentials directly via headers on authentication endpoint
      try {
        console.log(`[Auth Variant Header Auth] Attempting POST with Auth Headers to ${targetUrl}`);
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': qikinkClientId,
            'X-Client-Secret': qikinkClientSecret,
            'client_id': qikinkClientId,
            'ClientId': qikinkClientId,
            'client_secret': qikinkClientSecret,
            'client-id': qikinkClientId,
            'client-secret': qikinkClientSecret
          },
          body: JSON.stringify({ grant_type: "client_credentials" })
        });

        const text = await res.text();
        console.log(`[Header Auth Response] Endpoints ${path} returned status ${res.status}: ${text}`);

        if (res.ok) {
          try {
            const parsed = JSON.parse(text);
            const tokenCandidate = parsed?.access_token || parsed?.data?.access_token || parsed?.token || parsed?.data?.token || parsed?.sessionId || parsed?.data?.sessionId || parsed?.session_id;
            if (tokenCandidate) {
              tokenData = parsed;
              accessToken = tokenCandidate;
              console.log(`Successfully obtained token from Header-auth variant of ${path}: ${accessToken}`);
              break;
            }
          } catch (e) {
            console.log(`Failed to parse response JSON from Header-auth ${path}:`, e);
          }
        }
      } catch (err) {
        console.error(`Error executing Header-auth variant on ${path}:`, err);
      }
    }

    if (accessToken) {
      console.log("Authenticated successfully with Qikink. Access token obtained.");
    } else {
      console.warn("Could not retrieve a session/access token from any official path. Proceeding to downstream order endpoint directly with authentication credentials embedded in headers.");
    }

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

    // Define highly robust custom line items structure with multiple formats
    // We avoid passing non-numeric strings to product_id/variant_id to prevent WooCommerce/Shopify validation failures.
    const lineItemsItem = {
      sku: itemOrdered || "AURA-TSHIRT-M",
      barcode: itemOrdered || "AURA-TSHIRT-M",
      variant_sku: itemOrdered || "AURA-TSHIRT-M",
      name: itemOrdered || "AURA-001 Custom Apparel",
      title: itemOrdered || "AURA-001 Custom Apparel",
      quantity: parseInt(String(quantity || 1), 10) || 1,
      qty: parseInt(String(quantity || 1), 10) || 1,
      price: "0.00",
      price_unit: "0.00",
      rate: 0,
      retail_price: 0
    };

    // Construct highly robust address structure mapping postal codes, zip codes, and address lines
    const addressBlock = {
      first_name,
      last_name,
      name: nameStr,
      address1: addressLine1,
      address_1: addressLine1,
      address2: addressLine2,
      address_2: addressLine2,
      address: addrStr,
      city,
      state,
      pincode,
      postcode: pincode,
      post_code: pincode,
      pin_code: pincode,
      zip: pincode,
      zipcode: pincode,
      phone,
      country: "IN",
      email: "guest@example.com"
    };

    const qikinkOrderPayload: Record<string, any> = {
      // Direct personal/customer/address fields at the root level as requested by Qikink
      first_name,
      name: nameStr,
      last_name,
      phone,
      contact_no: phone,
      email: "guest@example.com",
      address1: addressLine1,
      address_1: addressLine1,
      address2: addressLine2,
      address_2: addressLine2,
      address: addrStr,
      city,
      state,
      pincode,
      zip: pincode,
      postcode: pincode,
      post_code: pincode,
      pin_code: pincode,
      zipcode: pincode,
      country: "IN",

      // 1. Root level flat properties (for Custom flat APIs and WooCommerce v2/v3)
      order_number: `AURA_ORDER_${timestamp}`,
      order_id: `AURA_ORDER_${timestamp}`,
      status: "draft",
      payment_method: "prepaid",
      payment_type: "prepaid",
      shipping_method: "flat_rate",
      shipping_address: addressBlock,
      billing_address: addressBlock,
      shipping: addressBlock,
      billing: addressBlock,
      line_items: [lineItemsItem],
      line_item: [lineItemsItem],
      items: [lineItemsItem],
      products: [lineItemsItem],
      order_items: [lineItemsItem],
      cart_items: [lineItemsItem],
      
      // 2. Wrap for WooCommerce nested or other custom nested expectations
      order: {
        order_number: `AURA_ORDER_${timestamp}`,
        order_id: `AURA_ORDER_${timestamp}`,
        status: "draft",
        payment_method: "prepaid",
        payment_type: "prepaid",
        shipping_method: "flat_rate",
        shipping_address: addressBlock,
        billing_address: addressBlock,
        shipping: addressBlock,
        billing: addressBlock,
        line_items: [lineItemsItem],
        line_item: [lineItemsItem],
        items: [lineItemsItem],
        products: [lineItemsItem],
        order_items: [lineItemsItem],
        cart_items: [lineItemsItem],
      },

      // 3. Wrap for Shopify-style nested draft order expectations
      draft_order: {
        order_number: `AURA_ORDER_${timestamp}`,
        order_key: `AURA_ORDER_${timestamp}`,
        order_id: `AURA_ORDER_${timestamp}`,
        status: "draft",
        payment_method: "prepaid",
        payment_type: "prepaid",
        shipping_address: addressBlock,
        billing_address: addressBlock,
        shipping: addressBlock,
        billing: addressBlock,
        line_items: [lineItemsItem],
        line_item: [lineItemsItem],
        items: [lineItemsItem],
        products: [lineItemsItem],
        order_items: [lineItemsItem],
        cart_items: [lineItemsItem],
      },

      // 4. Wrap for other WooCommerce/custom nested expectations
      order_data: {
        order_number: `AURA_ORDER_${timestamp}`,
        order_id: `AURA_ORDER_${timestamp}`,
        status: "draft",
        payment_method: "prepaid",
        payment_type: "prepaid",
        shipping_address: addressBlock,
        billing_address: addressBlock,
        shipping: addressBlock,
        billing: addressBlock,
        line_items: [lineItemsItem],
        line_item: [lineItemsItem],
        items: [lineItemsItem],
        products: [lineItemsItem],
        order_items: [lineItemsItem],
        cart_items: [lineItemsItem],
      }
    };

    console.log("Transmitting mapped draft order payload to Qikink:", JSON.stringify(qikinkOrderPayload, null, 2));

    // Construct headers combining token-authentication and direct header credentials
    const orderHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (accessToken) {
      orderHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    // Always mix-in direct authentication headers to support fallback header authentication!
    orderHeaders['X-Client-ID'] = qikinkClientId;
    orderHeaders['X-Client-Secret'] = qikinkClientSecret;
    orderHeaders['client_id'] = qikinkClientId;
    orderHeaders['ClientId'] = qikinkClientId;
    orderHeaders['client_secret'] = qikinkClientSecret;
    orderHeaders['client-id'] = qikinkClientId;
    orderHeaders['client-secret'] = qikinkClientSecret;

    console.log("Submitting order with mixed headers:", Object.keys(orderHeaders).filter(k => k.toLowerCase() !== 'x-client-secret' && k.toLowerCase() !== 'client_secret').join(', '));

    // Clean up base endpoint URL and construct exact target paths as requested
    const baseEndpoint = qikinkEndpoint.endsWith('/') ? qikinkEndpoint.slice(0, -1) : qikinkEndpoint;
    const primaryUrl = `${baseEndpoint}/order`;
    const fallbackUrl = `${baseEndpoint}/api/order`;

    let orderSuccess = false;
    let finalOrderResponseText = "";
    let attemptResults: string[] = [];

    // Attempt 1: POST to primary /order endpoint
    try {
      console.log(`[Order Creation] Attempting POST to primary URL: ${primaryUrl}`);
      const response = await fetch(primaryUrl, {
        method: 'POST',
        headers: orderHeaders,
        body: JSON.stringify(qikinkOrderPayload)
      });
      finalOrderResponseText = await response.text();
      attemptResults.push(`Primary (${primaryUrl}) status: ${response.status}, text: ${finalOrderResponseText}`);
      console.log(`[Order Attempt] Primary endpoint returned status ${response.status}: ${finalOrderResponseText}`);

      if (response.ok) {
        orderSuccess = true;
      }
    } catch (err: any) {
      console.error(`Error attempting primary order post to ${primaryUrl}:`, err);
      attemptResults.push(`Primary (${primaryUrl}) failed with error: ${err?.message || String(err)}`);
    }

    // Attempt 2: POST to fallback /api/order endpoint if primary failed
    if (!orderSuccess) {
      try {
        console.log(`[Order Creation] Primary target failed. Attempting fallback URL: ${fallbackUrl}`);
        const response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: orderHeaders,
          body: JSON.stringify(qikinkOrderPayload)
        });
        finalOrderResponseText = await response.text();
        attemptResults.push(`Fallback (${fallbackUrl}) status: ${response.status}, text: ${finalOrderResponseText}`);
        console.log(`[Order Attempt] Fallback endpoint returned status ${response.status}: ${finalOrderResponseText}`);

        if (response.ok) {
          orderSuccess = true;
        }
      } catch (err: any) {
        console.error(`Error attempting fallback order post to ${fallbackUrl}:`, err);
        attemptResults.push(`Fallback (${fallbackUrl}) failed with error: ${err?.message || String(err)}`);
      }
    }

    if (!orderSuccess) {
      throw new Error(`Qikink Order creation failed at both primary (/order) and fallback (/api/order) endpoints:\n${attemptResults.join('\n')}`);
    }

    let qikinkResponseData: any = null;
    try {
      qikinkResponseData = JSON.parse(finalOrderResponseText);
    } catch (parseErr) {
      console.warn("Order response was not valid JSON, returning raw text inside the response object:", parseErr);
      qikinkResponseData = { rawResponse: finalOrderResponseText };
    }

    console.log("Draft order created successfully inside Qikink:", qikinkResponseData);

    // Update Status inside Upstash Redis if available
    try {
      const redis = getRedisClient();
      if (redis) {
        const updatedData = {
          ...orderData,
          qikink_status: "created",
          qikink_order_id: qikinkResponseData?.order_id || qikinkResponseData?.id || qikinkResponseData?.data?.order_id || "unknown",
          qikink_response: qikinkResponseData
        };
        await redis.set(orderKey, updatedData);
      }
    } catch (updateErr) {
      console.error("Could not update Redis order status:", updateErr);
    }

    // Determine return message based on what details saved successfully
    const finalMessage = redisSaved 
      ? "Order saved perfectly to Upstash Redis and Draft Order successfully created in Qikink!"
      : "Draft Order successfully created in Qikink!";

    return res.status(200).json({
      success: true,
      message: finalMessage,
      orderKey,
      qikink: {
        success: true,
        data: qikinkResponseData
      }
    });

  } catch (error: any) {
    console.error("Error processing order in serverless function:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
}
