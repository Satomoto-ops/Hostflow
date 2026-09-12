import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.cleaningTask.findMany({
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
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching cleaning tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch cleaning tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { propertyId, cleanerName, date, status, notes } = body;

    if (!propertyId || !cleanerName || !date) {
      return NextResponse.json(
        { error: "Property, cleaner name, and date are required" },
        { status: 400 }
      );
    }

    const task = await prisma.cleaningTask.create({
      data: {
        propertyId,
        cleanerName,
        date: new Date(date),
        status: status || "Pending",
        notes: notes || null,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating cleaning task:", error);
    return NextResponse.json(
      { error: "Failed to create cleaning task" },
      { status: 500 }
    );
  }
}
