import { execSync } from 'node:child_process';

const eventId = '6ab9f88410eacb5f8ccd6940';
const result = execSync(`docker exec crt-backend-1 node --input-type=module -e "import mongoose from 'mongoose'; await mongoose.connect('mongodb://mongo:27017/CRT', { serverSelectionTimeoutMS: 5000 }); const doc = await mongoose.connection.db.collection('events').findOne({ _id: '${eventId}' }, { projection: { _id: 1, title: 1, status: 1, completionConfirmedAt: 1, createdAt: 1, updatedAt: 1, eventDate: 1, eventEndDate: 1, eventStartTime: 1, eventEndTime: 1, organizerId: 1 } }); console.log(JSON.stringify({ found: !!doc, doc: doc || null }, null, 2)); await mongoose.disconnect();"`, { encoding: 'utf8' });
console.log(result);

const logOutput = execSync('docker logs crt-backend-1 --tail 200', { encoding: 'utf8' });
const lines = logOutput.split(/\r?\n/).filter((line) => /auto-completion|complete|expired|sweep|Auto-completion|Expired/i.test(line));
console.log('\nSCHEDULER_LOG_MATCHES');
console.log(lines.slice(-40).join('\n') || 'No matching scheduler lines found');
