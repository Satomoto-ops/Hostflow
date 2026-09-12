import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "Active status must be a boolean." },
        { status: 400 }
      );
    }

    const housekeeper = await prisma.housekeeper.update({
      where: { id },
      data: { active: body.active },
    });
    return NextResponse.json(housekeeper);
  } catch (error) {
    console.error("Error updating housekeeper:", error);
    return NextResponse.json(
      { error: "Failed to update housekeeper" },
      { status: 500 }
    );
  }
}
