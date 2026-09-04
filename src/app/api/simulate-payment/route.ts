import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cropId, farmerId, amount, buyerId } = await request.json();

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate fake transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Return success — the client will update Firestore directly
    return NextResponse.json({
      success: true,
      transactionId,
      farmerReceived: amount * 0.95,
      platformFee: amount * 0.05,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
