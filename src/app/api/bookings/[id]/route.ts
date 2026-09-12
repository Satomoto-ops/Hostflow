import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isBookingPlatform,
  isBookingStatus,
  parseBookingAmount,
  parseBookingDates,
} from "@/lib/bookingValidation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, guestName, totalAmount, force, platform, checkIn, checkOut, propertyId } = body;

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

    const nextStatus = status ?? target.status;
    if (!isBookingStatus(nextStatus)) {
      return NextResponse.json({ error: "Unsupported booking status." }, { status: 400 });
    }

    const nextGuestName = guestName ?? target.guestName;
    if (typeof nextGuestName !== "string" || !nextGuestName.trim()) {
      return NextResponse.json({ error: "Guest name cannot be empty." }, { status: 400 });
    }

    const nextPlatform = platform ?? target.platform;
    if (!isBookingPlatform(nextPlatform)) {
      return NextResponse.json({ error: "Unsupported booking platform." }, { status: 400 });
    }

    const dates = parseBookingDates(
      checkIn ?? target.checkIn.toISOString(),
      checkOut ?? target.checkOut.toISOString()
    );
    if ("error" in dates) {
      return NextResponse.json({ error: dates.error }, { status: 400 });
    }

    const amount = parseBookingAmount(totalAmount ?? target.totalAmount);
    if ("error" in amount) {
      return NextResponse.json({ error: amount.error }, { status: 400 });
    }

    const nextPropertyId = propertyId ?? target.propertyId;
    const property = await prisma.property.findUnique({ where: { id: nextPropertyId } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const currentOccupant =
      nextStatus === "Checked-In"
        ? await prisma.booking.findFirst({
            where: {
              propertyId: nextPropertyId,
              status: "Checked-In",
              id: { not: id },
            },
            select: { id: true, guestName: true, checkOut: true },
          })
        : null;

    if (currentOccupant && !force) {
      return NextResponse.json(
        {
          error: `Cannot check in: Unit ${property.unitNumber} is currently occupied by ${currentOccupant.guestName}.`,
          collision: true,
          currentGuestName: currentOccupant.guestName,
          currentBookingId: currentOccupant.id,
          currentOccupant: {
            id: currentOccupant.id,
            guestName: currentOccupant.guestName,
            checkOut: currentOccupant.checkOut,
            unitNumber: property.unitNumber,
          },
        },
        { status: 409 }
      );
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: nextPropertyId,
        status: { in: ["Confirmed", "Checked-In"] },
        id: { not: id },
        checkIn: { lt: dates.end },
        checkOut: { gt: dates.start },
      },
      select: { id: true, guestName: true, status: true, checkOut: true },
    });

    if (conflictingBooking && (!force || conflictingBooking.status !== "Checked-In")) {
      return NextResponse.json(
        {
          error: `These dates overlap with ${conflictingBooking.guestName}'s existing reservation.`,
          collision: true,
          currentGuestName: conflictingBooking.guestName,
          currentBookingId: conflictingBooking.id,
          currentOccupant: {
            id: conflictingBooking.id,
            guestName: conflictingBooking.guestName,
            checkOut: conflictingBooking.checkOut,
            unitNumber: property.unitNumber,
          },
        },
        { status: 409 }
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      if (nextStatus === "Checked-In" && force && currentOccupant) {
        await tx.booking.update({
          where: { id: currentOccupant.id },
          data: { status: "Completed" },
        });
      }

      return tx.booking.update({
        where: { id },
        data: {
          status: nextStatus,
          guestName: nextGuestName.trim(),
          platform: nextPlatform,
          propertyId: nextPropertyId,
          checkIn: dates.start,
          checkOut: dates.end,
          totalAmount: amount.amount,
        },
        include: {
          property: true,
        },
      });
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
