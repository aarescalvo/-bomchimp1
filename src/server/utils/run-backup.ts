import { performBackup } from './cron';
import dotenv from 'dotenv';
dotenv.config();

console.log('Iniciando backup manual...');
performBackup().then(() => {
  console.log('Backup finalizado.');
  process.exit(0);
}).catch(err => {
  console.error('Fallo en backup:', err);
  process.exit(1);
});
