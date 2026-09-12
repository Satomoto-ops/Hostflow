import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function countCalendarNights(start: Date, end: Date) {
  return Math.max(
    1,
    Math.round(
      (startOfLocalDay(end).getTime() - startOfLocalDay(start).getTime()) /
        MILLISECONDS_PER_DAY
    )
  );
}

function getMonthlyRevenue(booking: { checkIn: Date; checkOut: Date; totalAmount: number }, year: number, month: number) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);
  const stayStart = startOfLocalDay(new Date(booking.checkIn));
  const stayEnd = startOfLocalDay(new Date(booking.checkOut));
  const totalNights = countCalendarNights(stayStart, stayEnd);
  const overlapStart = new Date(Math.max(stayStart.getTime(), monthStart.getTime()));
  const overlapEnd = new Date(Math.min(stayEnd.getTime(), monthEnd.getTime()));

  if (overlapStart >= overlapEnd) return 0;

  const nightsInMonth = Math.round(
    (overlapEnd.getTime() - overlapStart.getTime()) / MILLISECONDS_PER_DAY
  );
  return (booking.totalAmount / totalNights) * nightsInMonth;
}

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

    // Revenue is recognized per stay night, so cross-month bookings are prorated.
    const revenueBookings = allBookings.filter((b) => b.status !== "Cancelled");
    const totalMonthlyRevenue = revenueBookings.reduce(
      (sum, b) => sum + getMonthlyRevenue(b, currentYear, currentMonth),
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

    revenueBookings.forEach((b) => {
      const cIn = new Date(b.checkIn);
      const cOut = new Date(b.checkOut);
      const firstMonth = new Date(cIn.getFullYear(), cIn.getMonth(), 1);
      const lastMonth = new Date(cOut.getFullYear(), cOut.getMonth(), 1);

      for (
        const monthDate = new Date(firstMonth);
        monthDate <= lastMonth;
        monthDate.setMonth(monthDate.getMonth() + 1)
      ) {
        const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
        if (!revenueTrendMap[key]) continue;

        const monthlyRevenue = getMonthlyRevenue(
          b,
          monthDate.getFullYear(),
          monthDate.getMonth()
        );
        if (monthlyRevenue <= 0) continue;

        revenueTrendMap[key].revenue += monthlyRevenue;
        revenueTrendMap[key].bookingsCount += 1;
        const plat = b.platform.toLowerCase();
        if (plat.includes("airbnb")) {
          revenueTrendMap[key].airbnb += monthlyRevenue;
        } else if (plat.includes("booking")) {
          revenueTrendMap[key].bookingCom += monthlyRevenue;
        } else if (plat.includes("direct")) {
          revenueTrendMap[key].direct += monthlyRevenue;
        } else {
          revenueTrendMap[key].vrbo += monthlyRevenue;
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
