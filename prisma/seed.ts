import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing records
  await prisma.cleaningTask.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();

  // Create Properties
  const prop1 = await prisma.property.create({
    data: {
      name: "Azure Luxe Suite 14B",
      unitNumber: "1402",
      buildingName: "Azure Urban Resort Residences",
      basePrice: 3800,
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      name: "Skyline Horizon Studio",
      unitNumber: "2805",
      buildingName: "The Gramercy Residences",
      basePrice: 4200,
    },
  });

  const prop3 = await prisma.property.create({
    data: {
      name: "Serene Bay Loft",
      unitNumber: "812",
      buildingName: "One Palm Tree Villas",
      basePrice: 2900,
    },
  });

  const prop4 = await prisma.property.create({
    data: {
      name: "Grand Botanical Haven",
      unitNumber: "1908",
      buildingName: "Acqua Private Residences",
      basePrice: 5100,
    },
  });

  const prop5 = await prisma.property.create({
    data: {
      name: "Metropolitan Corner Suite",
      unitNumber: "3201",
      buildingName: "Shang Salcedo Place",
      basePrice: 6500,
    },
  });

  const prop6 = await prisma.property.create({
    data: {
      name: "Harbor View Penthouse",
      unitNumber: "4502",
      buildingName: "Anchor Skysuites",
      basePrice: 7800,
    },
  });

  const today = new Date();
  const makeDate = (offsetDays: number, hour = 14) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  // Seed Bookings
  // Past completed bookings for revenue history
  const bookingsData = [
    // Completed last month / earlier
    {
      propertyId: prop1.id,
      guestName: "Alexander Wright",
      platform: "Airbnb",
      checkIn: makeDate(-25),
      checkOut: makeDate(-20, 11),
      totalAmount: 19000,
      status: "Completed",
    },
    {
      propertyId: prop2.id,
      guestName: "Sophia Chen",
      platform: "Booking.com",
      checkIn: makeDate(-18),
      checkOut: makeDate(-14, 11),
      totalAmount: 16800,
      status: "Completed",
    },
    {
      propertyId: prop3.id,
      guestName: "Marcus Vance",
      platform: "Direct",
      checkIn: makeDate(-12),
      checkOut: makeDate(-9, 11),
      totalAmount: 8700,
      status: "Completed",
    },
    {
      propertyId: prop4.id,
      guestName: "Olivia Taylor",
      platform: "Airbnb",
      checkIn: makeDate(-10),
      checkOut: makeDate(-5, 11),
      totalAmount: 25500,
      status: "Completed",
    },
    {
      propertyId: prop5.id,
      guestName: "David Sterling",
      platform: "VRBO",
      checkIn: makeDate(-7),
      checkOut: makeDate(-2, 11),
      totalAmount: 32500,
      status: "Completed",
    },
    // Historical Archives (August 2026, July 2026, June 2026, and 2025)
    {
      propertyId: prop6.id,
      guestName: "Lucas Alcantara",
      platform: "Airbnb",
      checkIn: makeDate(-38),
      checkOut: makeDate(-32, 11),
      totalAmount: 46800,
      status: "Completed",
    },
    {
      propertyId: prop1.id,
      guestName: "Claire Beauchamp",
      platform: "Booking.com",
      checkIn: makeDate(-45),
      checkOut: makeDate(-41, 11),
      totalAmount: 15200,
      status: "Completed",
    },
    {
      propertyId: prop3.id,
      guestName: "Mateo Rossi",
      platform: "Direct",
      checkIn: makeDate(-55),
      checkOut: makeDate(-50, 11),
      totalAmount: 14500,
      status: "Completed",
    },
    {
      propertyId: prop2.id,
      guestName: "Hanna Lindqvist",
      platform: "Airbnb",
      checkIn: makeDate(-68),
      checkOut: makeDate(-63, 11),
      totalAmount: 21000,
      status: "Completed",
    },
    {
      propertyId: prop5.id,
      guestName: "Benjamin Miller",
      platform: "VRBO",
      checkIn: makeDate(-80),
      checkOut: makeDate(-74, 11),
      totalAmount: 39000,
      status: "Completed",
    },
    {
      propertyId: prop4.id,
      guestName: "Zoe Kravitz",
      platform: "Direct",
      checkIn: makeDate(-92),
      checkOut: makeDate(-88, 11),
      totalAmount: 20400,
      status: "Completed",
    },
    {
      propertyId: prop6.id,
      guestName: "Arthur Pendelton",
      platform: "Booking.com",
      checkIn: new Date("2025-12-15T14:00:00Z"),
      checkOut: new Date("2025-12-20T11:00:00Z"),
      totalAmount: 39000,
      status: "Completed",
    },
    {
      propertyId: prop1.id,
      guestName: "Catherine Howard",
      platform: "Airbnb",
      checkIn: new Date("2025-11-10T14:00:00Z"),
      checkOut: new Date("2025-11-15T11:00:00Z"),
      totalAmount: 19000,
      status: "Completed",
    },
    // Currently Active / Checked-In
    {
      propertyId: prop1.id,
      guestName: "Liam Johnson",
      platform: "Airbnb",
      checkIn: makeDate(-2),
      checkOut: makeDate(3, 11),
      totalAmount: 19000,
      status: "Checked-In",
    },
    {
      propertyId: prop2.id,
      guestName: "Isabella Martinez",
      platform: "Direct",
      checkIn: makeDate(-1),
      checkOut: makeDate(4, 11),
      totalAmount: 21000,
      status: "Checked-In",
    },
    {
      propertyId: prop4.id,
      guestName: "Noah Henderson",
      platform: "Booking.com",
      checkIn: makeDate(0),
      checkOut: makeDate(2, 11),
      totalAmount: 10200,
      status: "Checked-In",
    },
    // Upcoming Confirmed
    {
      propertyId: prop3.id,
      guestName: "Chloe Davenport",
      platform: "Airbnb",
      checkIn: makeDate(1),
      checkOut: makeDate(5, 11),
      totalAmount: 11600,
      status: "Confirmed",
    },
    {
      propertyId: prop5.id,
      guestName: "Ethan Reynolds",
      platform: "Airbnb",
      checkIn: makeDate(2),
      checkOut: makeDate(7, 11),
      totalAmount: 32500,
      status: "Confirmed",
    },
    {
      propertyId: prop6.id,
      guestName: "Grace Montgomery",
      platform: "Direct",
      checkIn: makeDate(3),
      checkOut: makeDate(8, 11),
      totalAmount: 39000,
      status: "Confirmed",
    },
    {
      propertyId: prop1.id,
      guestName: "Julian Baker",
      platform: "Booking.com",
      checkIn: makeDate(5),
      checkOut: makeDate(9, 11),
      totalAmount: 15200,
      status: "Confirmed",
    },
    {
      propertyId: prop2.id,
      guestName: "Emily Watson",
      platform: "Airbnb",
      checkIn: makeDate(6),
      checkOut: makeDate(10, 11),
      totalAmount: 16800,
      status: "Confirmed",
    },
  ];

  for (const b of bookingsData) {
    await prisma.booking.create({ data: b });
  }

  // Seed Cleaning Tasks
  const cleaningData = [
    {
      propertyId: prop3.id,
      cleanerName: "Elena Reyes",
      date: makeDate(0, 10), // Today 10:00 AM
      status: "Pending",
      notes: "Preparation for upcoming 3 PM check-in. Restock Nespresso pods and plush bath sheets.",
    },
    {
      propertyId: prop6.id,
      cleanerName: "Marco Santos",
      date: makeDate(0, 13), // Today 1:00 PM
      status: "In-Progress",
      notes: "Mid-week balcony glass polish and deep linen steam for Penthouse unit.",
    },
    {
      propertyId: prop4.id,
      cleanerName: "Maria Gomez",
      date: makeDate(1, 11), // Tomorrow 11:00 AM
      status: "Pending",
      notes: "Standard turnover post-checkout. Check AC filter and smart lock battery.",
    },
    {
      propertyId: prop1.id,
      cleanerName: "Rico Cruz",
      date: makeDate(2, 9),
      status: "Pending",
      notes: "Full disinfectant sanitization and balcony furniture refresh.",
    },
    {
      propertyId: prop2.id,
      cleanerName: "Elena Reyes",
      date: makeDate(-1, 14),
      status: "Completed",
      notes: "Completed full turn-around before Isabella Martinez check-in.",
    },
    {
      propertyId: prop5.id,
      cleanerName: "Marco Santos",
      date: makeDate(-3, 10),
      status: "Completed",
      notes: "Deep carpet shampooing and kitchen cookware inspection.",
    },
  ];

  for (const c of cleaningData) {
    await prisma.cleaningTask.create({ data: c });
  }

  console.log("Mock data successfully seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
