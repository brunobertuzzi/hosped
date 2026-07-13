const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, 'test', 'e2e');
const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.e2e-spec.ts'));

for (const file of files) {
  const filePath = path.join(e2eDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace cleanup(name: string) function
  content = content.replace(/async function cleanup\(name: string\) {[\s\S]*?}/, `async function cleanup(name: string) {\n  await prisma.hotel.deleteMany({ where: { nome: name } });\n}`);

  // Replace cleanup() without args (hardcoded hotel name)
  content = content.replace(/async function cleanup\(\) {[\s\S]*?await prisma\.hotel\.deleteMany\(\{ where: \{ nome: '([^']+)' \} \}\);\s*}/, `async function cleanup() {\n  await prisma.hotel.deleteMany({ where: { nome: '$1' } });\n}`);

  // Replace manual deleteMany block in cross-feature.e2e-spec.ts
  if (file === 'cross-feature.e2e-spec.ts') {
    content = content.replace(/await prisma\.tariff\.deleteMany\([\s\S]*?await prisma\.hotel\.deleteMany\(\{ where: \{ nome: 'E2E Cross Hotel' \} \}\);/g, `await prisma.hotel.deleteMany({ where: { nome: 'E2E Cross Hotel' } });`);
  }

  // Same for afterAll in cross-feature
  content = content.replace(/afterAll\(async \(\) => {[\s\S]*?await prisma\.payment\.deleteMany\(\{ where: \{ hotelId \} \}\);[\s\S]*?await prisma\.hotel\.delete\(\{ where: \{ id: hotelId \} \}\);\s*}\);/, `afterAll(async () => {\n    await prisma.hotel.deleteMany({ where: { id: hotelId } });\n  });`);

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
