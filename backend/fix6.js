const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, 'test', 'e2e');
const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.e2e-spec.ts'));

for (const file of files) {
  const filePath = path.join(e2eDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace prisma.hotel.findMany({ where: { nome: { startsWith: ... } } }) 
  // with a safe fetch-all and filter.

  content = content.replace(/const hotels = await prisma\.hotel\.findMany\(\{ where: \{ nome: \{ startsWith: name \} \} \}\);/g, `const allHotels = await prisma.hotel.findMany();\n  const hotels = allHotels.filter(h => h.nome.startsWith(name));`);

  content = content.replace(/const hotels = await prisma\.hotel\.findMany\(\{ where: \{ nome: \{ startsWith: '([^']+)' \} \} \}\);/g, `const allHotels = await prisma.hotel.findMany();\n  const hotels = allHotels.filter(h => h.nome.startsWith('$1'));`);

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
