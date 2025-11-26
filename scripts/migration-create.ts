import { execSync } from 'child_process';

const args = process.argv.slice(2).join(' ');
const command = `mikro-orm migration:create ${args} --config mikro-orm.config.ts`;

try {
  execSync(command, { stdio: 'inherit', cwd: process.cwd() });
} catch (error) {
  process.exit(1);
}

