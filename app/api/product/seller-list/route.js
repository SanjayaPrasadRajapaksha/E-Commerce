import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Products";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    //console.log(request)
    const { userId } = getAuth(request);
    const isSeller = authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not authorized" });
    }
    await connectDB();
    const products = await Product.find({});
        console.log("products",products)
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ success: true, message: error.message });
  }
}
