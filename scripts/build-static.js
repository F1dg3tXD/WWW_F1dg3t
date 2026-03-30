const fs = require('fs/promises');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'build');
const filesToCopy = ['index.html', 'style.css', 'main.js', 'data.json'];

async function run() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  for (const file of filesToCopy) {
    await fs.copyFile(path.join(root, file), path.join(outDir, file));
  }

  console.log(`Built static site in ${outDir}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
