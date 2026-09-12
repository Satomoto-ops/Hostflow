import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Fetch properties
    const properties = await prisma.property.findMany({
      include: {
        bookings: true,
        cleaningTasks: true,
      },
    });

    // 2. Fetch all bookings
    const allBookings = await prisma.booking.findMany({
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
        checkIn: "desc",
      },
    });

    // 3. Fetch all cleaning tasks
    const allCleaningTasks = await prisma.cleaningTask.findMany({
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
        date: "asc",
      },
    });

    // Active units calculation: properties that have a booking active today
    const occupiedPropertyIds = new Set<string>();
    allBookings.forEach((b) => {
      const cIn = new Date(b.checkIn);
      const cOut = new Date(b.checkOut);
      if (
        b.status === "Checked-In" ||
        (b.status === "Confirmed" && now >= cIn && now <= cOut)
      ) {
        occupiedPropertyIds.add(b.propertyId);
      }
    });

    const activeUnits = occupiedPropertyIds.size;
    const totalUnits = properties.length;

    // Total Monthly Revenue (bookings occurring in this current month/year)
    const currentMonthBookings = allBookings.filter((b) => {
      const cIn = new Date(b.checkIn);
      return (
        cIn.getFullYear() === currentYear &&
        cIn.getMonth() === currentMonth &&
        b.status !== "Cancelled"
      );
    });

    const totalMonthlyRevenue = currentMonthBookings.reduce(
      (sum, b) => sum + b.totalAmount,
      0
    );

    // Pending Cleanings (Pending or In-Progress)
    const pendingCleanings = allCleaningTasks.filter(
      (t) => t.status === "Pending" || t.status === "In-Progress"
    ).length;

    // Upcoming Check-Ins: checkIn >= today and Confirmed status
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const upcomingCheckIns = allBookings.filter((b) => {
      const cIn = new Date(b.checkIn);
      return cIn >= startOfToday && b.status === "Confirmed";
    });

    // Revenue Trend Line Data (Past 6 months + Current month)
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const revenueTrendMap: {
      [key: string]: {
        month: string;
        revenue: number;
        airbnb: number;
        bookingCom: number;
        direct: number;
        vrbo: number;
        bookingsCount: number;
      };
    } = {};

    // Initialize 6 months up to current
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear() === currentYear ? "" : `'${String(d.getFullYear()).slice(-2)}`}`.trim();
      revenueTrendMap[key] = {
        month: label,
        revenue: 0,
        airbnb: 0,
        bookingCom: 0,
        direct: 0,
        vrbo: 0,
        bookingsCount: 0,
      };
    }

    allBookings.forEach((b) => {
      const cIn = new Date(b.checkIn);
      const key = `${cIn.getFullYear()}-${String(cIn.getMonth() + 1).padStart(2, "0")}`;
      if (revenueTrendMap[key]) {
        revenueTrendMap[key].revenue += b.totalAmount;
        revenueTrendMap[key].bookingsCount += 1;
        const plat = b.platform.toLowerCase();
        if (plat.includes("airbnb")) {
          revenueTrendMap[key].airbnb += b.totalAmount;
        } else if (plat.includes("booking")) {
          revenueTrendMap[key].bookingCom += b.totalAmount;
        } else if (plat.includes("direct")) {
          revenueTrendMap[key].direct += b.totalAmount;
        } else {
          revenueTrendMap[key].vrbo += b.totalAmount;
        }
      }
    });

    const monthlyRevenueTrend = Object.values(revenueTrendMap);

    return NextResponse.json({
      kpis: {
        activeUnits,
        totalUnits,
        occupancyRate: totalUnits > 0 ? Math.round((activeUnits / totalUnits) * 100) : 0,
        totalMonthlyRevenue,
        pendingCleanings,
        upcomingCheckInsCount: upcomingCheckIns.length,
      },
      monthlyRevenueTrend,
      allBookings,
      upcomingCheckIns: upcomingCheckIns.slice(0, 5),
    });
  } catch (error) {
    console.error("Error generating dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to generate dashboard metrics" },
      { status: 500 }
    );
  }
}
