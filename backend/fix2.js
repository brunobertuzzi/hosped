const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, 'test', 'e2e');
const files = ['mercado-pago.e2e-spec.ts', 'real-world.e2e-spec.ts', 'rls.e2e-spec.ts'];

for (const file of files) {
  const filePath = path.join(e2eDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Let's just do a clean regex
  content = content.replace(/async function cleanup\(name: string\) \{[\s\S]*?(describe\()/g, 'async function cleanup(name: string) {\n  await prisma.hotel.deleteMany({ where: { nome: name } });\n}\n\n$1');
  
  // Clean up any duplicated loginWithRetry from real-world
  if (file === 'real-world.e2e-spec.ts') {
    const parts = content.split('import axios from \'axios\';');
    if (parts.length > 2) {
      // It was duplicated
      content = 'import axios from \'axios\';' + parts.slice(2).join('import axios from \'axios\';');
    }
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
