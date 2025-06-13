import { inngest } from "@/config/inngest";
import Order from "@/models/Order";
import Product from "@/models/Products";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { address, items } = await request.json();

    if (!address || items.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid data" });
    }

    // Calculate total amount
    const amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      if (!product) throw new Error("Product not found: " + item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    // Send event to Inngest
    const s = await inngest.send({
      name: "order/created",
      data: {
        userId,
        items,
        amount: amount + Math.floor(amount * 0.02),
        address,
        date: Date.now(),
      },
    });

    // Create order only if event was sent successfully
    let order;
    if (s) {
      order = new Order({
        userId,
        items,
        amount: amount + Math.floor(amount * 0.02), // Adding 2% fee
        address,
        date: Date.now(),
        status: "Order Placed",
      });

      // Save order to DB
      await order.save();
    } else {
      return NextResponse.json({ success: false, message: "Failed to create order event" });
    }

    // Clear user cart
    const user = await User.findById(userId);
    if (user) {
      user.cartItems = {};
      await user.save();
    }

    return NextResponse.json({ success: true, message: "Order Placed", orderId: order._id });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
