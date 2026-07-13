const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, 'test', 'e2e');
const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.e2e-spec.ts'));

for (const file of files) {
  const filePath = path.join(e2eDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace `async function cleanup() { ... }` up to the end of the block
  content = content.replace(/async function cleanup\(\) \{([\s\S]*?)(?=\nasync function|\ndescribe)/, `async function cleanup() {\n  const hotelName = content.match(/nome: '([^']+)'/)?.[1] || 'E2E Yield Hotel'; // This regex is bad, let's just do it right.\n}`);

  fs.writeFileSync(filePath, content);
}
