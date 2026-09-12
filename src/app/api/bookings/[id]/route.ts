import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, guestName, totalAmount, force } = body;

    const target = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!target) {
      return NextResponse.json(
        { error: "Booking record not found" },
        { status: 404 }
      );
    }

    // Backend Safety Guard: If setting status to "Checked-In", ensure unit isn't already occupied
    if (status === "Checked-In" && !force) {
      const existingOccupant = await prisma.booking.findFirst({
        where: {
          propertyId: target.propertyId,
          status: "Checked-In",
          id: { not: id },
        },
      });

      if (existingOccupant) {
        return NextResponse.json(
          {
            error: `Cannot Check In: Unit ${target.property.unitNumber} is currently occupied by ${existingOccupant.guestName}. Please check out the current guest first.`,
            collision: true,
            currentOccupant: {
              id: existingOccupant.id,
              guestName: existingOccupant.guestName,
              checkOut: existingOccupant.checkOut,
              unitNumber: target.property.unitNumber,
            },
          },
          { status: 409 }
        );
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(guestName ? { guestName } : {}),
        ...(totalAmount !== undefined ? { totalAmount: parseFloat(totalAmount) } : {}),
      },
      include: {
        property: true,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.booking.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
