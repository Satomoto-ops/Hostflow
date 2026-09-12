import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const housekeepers = await prisma.housekeeper.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(housekeepers);
  } catch (error) {
    console.error("Error fetching housekeepers:", error);
    return NextResponse.json(
      { error: "Failed to fetch housekeepers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Housekeeper name is required." },
        { status: 400 }
      );
    }

    const housekeeper = await prisma.housekeeper.create({
      data: { name },
    });
    return NextResponse.json(housekeeper, { status: 201 });
  } catch (error) {
    console.error("Error creating housekeeper:", error);
    return NextResponse.json(
      { error: "Failed to create housekeeper" },
      { status: 500 }
    );
  }
}
