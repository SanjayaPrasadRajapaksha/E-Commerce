import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Address from "@/models/Address";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not authorized" });
    }
    await connectDB();

 
    const orders = await Order.find({}).populate("address items.product");
    console.log(orders)

    return NextResponse.json({ success: true, orders });
  } catch (error) {

    return NextResponse.json({ success: true, message: error.message });
  }
}
