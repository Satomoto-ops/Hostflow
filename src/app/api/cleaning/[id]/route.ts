import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, cleanerName, notes } = body;

    const existing = await prisma.cleaningTask.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cleaning task not found" },
        { status: 404 }
      );
    }

    const nextStatus = status || existing.status;
    const nextCleanerName = cleanerName || existing.cleanerName;
    const updatedTask = await prisma.$transaction(async (tx) => {
      if (
        nextStatus !== "Completed" &&
        nextCleanerName !== "Unassigned"
      ) {
        const activeUnitAssignment = await tx.cleaningTask.findFirst({
          where: {
            id: { not: id },
            propertyId: existing.propertyId,
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
            id: { not: id },
            cleanerName: nextCleanerName,
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

      return tx.cleaningTask.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(cleanerName ? { cleanerName } : {}),
          ...(notes !== undefined ? { notes } : {}),
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

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Housekeeper is already") ||
        error.message.startsWith("Unit "))
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error updating cleaning task:", error);
    return NextResponse.json(
      { error: "Failed to update cleaning task" },
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
    await prisma.cleaningTask.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cleaning task:", error);
    return NextResponse.json(
      { error: "Failed to delete cleaning task" },
      { status: 500 }
    );
  }
}
