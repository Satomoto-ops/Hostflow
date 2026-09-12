import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isBookingPlatform,
  isBookingStatus,
  parseBookingAmount,
  parseBookingDates,
} from "@/lib/bookingValidation";

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true,
            unitNumber: true,
            buildingName: true,
            basePrice: true,
          },
        },
      },
      orderBy: {
        checkIn: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      propertyId,
      guestName,
      platform,
      checkIn,
      checkOut,
      totalAmount,
      status,
    } = body;

    if (!propertyId || typeof guestName !== "string" || !guestName.trim()) {
      return NextResponse.json(
        { error: "Property and guest name are required." },
        { status: 400 }
      );
    }

    if (!isBookingPlatform(platform)) {
      return NextResponse.json({ error: "Unsupported booking platform." }, { status: 400 });
    }

    const dates = parseBookingDates(checkIn, checkOut);
    if ("error" in dates) {
      return NextResponse.json({ error: dates.error }, { status: 400 });
    }

    const amount = parseBookingAmount(totalAmount);
    if ("error" in amount) {
      return NextResponse.json({ error: amount.error }, { status: 400 });
    }

    const normalizedStatus = status || "Confirmed";
    if (!isBookingStatus(normalizedStatus)) {
      return NextResponse.json({ error: "Unsupported booking status." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ["Confirmed", "Checked-In"] },
        checkIn: { lt: dates.end },
        checkOut: { gt: dates.start },
      },
      select: { guestName: true, checkIn: true, checkOut: true },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        {
          error: `These dates overlap with ${conflictingBooking.guestName}'s existing reservation.`,
          collision: true,
        },
        { status: 409 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        guestName: guestName.trim(),
        platform,
        checkIn: dates.start,
        checkOut: dates.end,
        totalAmount: amount.amount,
        status: normalizedStatus,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            unitNumber: true,
            buildingName: true,
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
