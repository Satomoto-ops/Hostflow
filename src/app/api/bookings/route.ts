import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    if (
      !propertyId ||
      !guestName ||
      !platform ||
      !checkIn ||
      !checkOut ||
      totalAmount === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields for booking" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        guestName,
        platform,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        totalAmount: parseFloat(totalAmount),
        status: status || "Confirmed",
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
