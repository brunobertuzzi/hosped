const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, 'test', 'e2e');
const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.e2e-spec.ts'));

for (const file of files) {
  const filePath = path.join(e2eDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const robustCleanup = `async function cleanup(name: string) {
  const hotels = await prisma.hotel.findMany({ where: { nome: { startsWith: name } } });
  for (const hotel of hotels) {
    const hotelId = hotel.id;
    await prisma.payment.deleteMany({ where: { hotelId } });
    await prisma.consumption.deleteMany({ where: { hotelId } });
    await prisma.reservation.deleteMany({ where: { hotelId } });
    await prisma.guest.deleteMany({ where: { hotelId } });
    await prisma.tariff.deleteMany({ where: { hotelId } });
    await prisma.season.deleteMany({ where: { hotelId } });
    await prisma.room.deleteMany({ where: { hotelId } });
    await prisma.roomCategory.deleteMany({ where: { hotelId } });
    await prisma.user.deleteMany({ where: { hotelId } });
    await prisma.branch.deleteMany({ where: { hotelId } });
    await prisma.hotel.delete({ where: { id: hotelId } });
  }
}`;

  // Replace cleanup(name: string)
  content = content.replace(/async function cleanup\(name: string\) \{[\s\S]*?\n\}/, robustCleanup);

  // Replace cleanup()
  if (content.match(/async function cleanup\(\) \{/)) {
    // extract the hotel name from the file
    let name = 'E2E';
    if (file.includes('yield')) name = 'E2E Yield Hotel';
    else if (file.includes('overbooking')) name = 'E2E Overbooking Hotel';
    else if (file.includes('cross-feature')) name = 'E2E Cross Hotel';
    else if (file.includes('rls')) name = 'E2E RLS';

    const paramLessCleanup = `async function cleanup() {
  const hotels = await prisma.hotel.findMany({ where: { nome: { startsWith: '${name}' } } });
  for (const hotel of hotels) {
    const hotelId = hotel.id;
    await prisma.payment.deleteMany({ where: { hotelId } });
    await prisma.consumption.deleteMany({ where: { hotelId } });
    await prisma.reservation.deleteMany({ where: { hotelId } });
    await prisma.guest.deleteMany({ where: { hotelId } });
    await prisma.tariff.deleteMany({ where: { hotelId } });
    await prisma.season.deleteMany({ where: { hotelId } });
    await prisma.room.deleteMany({ where: { hotelId } });
    await prisma.roomCategory.deleteMany({ where: { hotelId } });
    await prisma.user.deleteMany({ where: { hotelId } });
    await prisma.branch.deleteMany({ where: { hotelId } });
    await prisma.hotel.delete({ where: { id: hotelId } });
  }
}`;
    content = content.replace(/async function cleanup\(\) \{[\s\S]*?\n\}/, paramLessCleanup);
  }

  // Handle rls.e2e-spec.ts specific po@e2erls.com user delete
  if (file === 'rls.e2e-spec.ts') {
    content = content.replace('await prisma.hotel.delete({ where: { id: hotelId } });\n  }', `await prisma.hotel.delete({ where: { id: hotelId } });\n  }\n  await prisma.user.deleteMany({ where: { email: 'po@e2erls.com' } });`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
