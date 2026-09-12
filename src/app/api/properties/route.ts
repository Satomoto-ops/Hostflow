import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const properties = await prisma.property.findMany({
      include: {
        bookings: {
          orderBy: { checkIn: "asc" },
        },
        cleaningTasks: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { unitNumber: "asc" },
    });

    // Determine occupied status for each property
    const enrichedProperties = properties.map((prop) => {
      // Find if there's any active booking right now
      const activeBooking = prop.bookings.find((b) => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        return (
          b.status === "Checked-In" ||
          (b.status === "Confirmed" && now >= checkIn && now <= checkOut)
        );
      });

      const nextBooking = prop.bookings.find((b) => {
        return new Date(b.checkIn) > now && b.status === "Confirmed";
      });

      const pendingCleanings = prop.cleaningTasks.filter(
        (t) => t.status === "Pending" || t.status === "In-Progress"
      );

      return {
        ...prop,
        isOccupied: Boolean(activeBooking),
        activeBooking: activeBooking || null,
        nextBooking: nextBooking || null,
        pendingCleaningsCount: pendingCleanings.length,
      };
    });

    return NextResponse.json(enrichedProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, unitNumber, buildingName, basePrice } = body;

    if (!name || !unitNumber || !buildingName || !basePrice) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const newProperty = await prisma.property.create({
      data: {
        name,
        unitNumber: String(unitNumber).trim(),
        buildingName: String(buildingName).trim(),
        basePrice: parseFloat(basePrice),
      },
    });

    return NextResponse.json(newProperty, { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
