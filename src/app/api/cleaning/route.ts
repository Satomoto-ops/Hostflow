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
    const nextStatus = status || "Pending";

    if (!propertyId || !cleanerName || !date) {
      return NextResponse.json(
        { error: "Property, cleaner name, and date are required" },
        { status: 400 }
      );
    }

    const task = await prisma.$transaction(async (tx) => {
      if (nextStatus !== "Completed") {
        const activeUnitAssignment = await tx.cleaningTask.findFirst({
          where: {
            propertyId,
            status: { in: ["Pending", "In-Progress"] },
          },
          select: { property: { select: { unitNumber: true } } },
        });

        if (activeUnitAssignment) {
          throw new Error(
            `Unit ${activeUnitAssignment.property.unitNumber} already has an active cleaning assignment`
          );
        }

        const activeAssignment = await tx.cleaningTask.findFirst({
          where: {
            cleanerName,
            status: { in: ["Pending", "In-Progress"] },
          },
          select: { property: { select: { unitNumber: true } } },
        });

        if (activeAssignment) {
          throw new Error(
            `Housekeeper is already assigned to Unit ${activeAssignment.property.unitNumber}`
          );
        }
      }

      return tx.cleaningTask.create({
        data: {
          propertyId,
          cleanerName,
          date: new Date(date),
          status: nextStatus,
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
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Housekeeper is already") ||
        error.message.startsWith("Unit "))
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error creating cleaning task:", error);
    return NextResponse.json(
      { error: "Failed to create cleaning task" },
      { status: 500 }
    );
  }
}
