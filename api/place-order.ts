import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const { customerName, shippingAddress, itemOrdered, quantity } = req.body || {};

    console.log("Order logged perfectly by Vercel serverless function:", {
      customerName,
      shippingAddress,
      itemOrdered,
      quantity
    });

    return res.status(200).json({
      success: true,
      message: "Order data caught perfectly by Vercel server!"
    });
  } catch (error: any) {
    console.error("Error processing order in serverless function:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
