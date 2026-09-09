import mongoose from 'mongoose';
import env from './src/config/env.js';
import { getRedisClient } from './src/config/redis.js';

const redis = getRedisClient();
const uri = env.MONGO_URI;
const query = { status: { $in: ['upcoming', 'live'] } };
const BASE_URL = 'http://localhost:3000';

const percentile = (arr, p) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
};

const summarize = (arr) => {
  if (!arr.length) return { avg: 0, p50: 0, p95: 0, max: 0 };
  const sum = arr.reduce((total, value) => total + value, 0);
  return {
    avg: sum / arr.length,
    p50: percentile(arr, 50),
    p95: percentile(arr, 95),
    max: Math.max(...arr),
  };
};

const measureFetch = async (label, fn, iterations = 25) => {
  const values = [];
  for (let i = 0; i < iterations; i += 1) {
    const started = performance.now();
    const result = await fn();
    values.push(performance.now() - started);
    if (result && typeof result === 'object' && 'status' in result && result.status !== 200) {
      console.log(JSON.stringify({ label, unexpectedStatus: result.status }, null, 2));
    }
  }
  return { label, ...summarize(values) };
};

const measureHttp = async (path, iterations = 25, concurrency = 10) => {
  const times = [];
  const chunks = [];
  for (let i = 0; i < iterations; i += concurrency) {
    const batch = Array.from({ length: Math.min(concurrency, iterations - i) }, async () => {
      const started = performance.now();
      const res = await fetch(`${BASE_URL}${path}`);
      const elapsed = performance.now() - started;
      times.push(elapsed);
      chunks.push({ status: res.status, elapsedMs: elapsed });
      return res;
    });
    await Promise.all(batch);
  }
  return { label: path, ...summarize(times), sample: chunks.slice(0, 5) };
};

const run = async () => {
  console.log(JSON.stringify({ info: { baseUrl: BASE_URL, mongoHost: new URL(uri).hostname, redisOpen: !!redis?.isOpen } }, null, 2));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, retryWrites: false });
  const collection = mongoose.connection.db.collection('events');

  if (redis?.isOpen) {
    const redisGetTimes = [];
    const redisSetTimes = [];
    for (let i = 0; i < 40; i += 1) {
      const t1 = performance.now();
      await redis.get('latency_probe_key');
      redisGetTimes.push(performance.now() - t1);

      const t2 = performance.now();
      await redis.set('latency_probe_key', String(Date.now()), { EX: 5 });
      redisSetTimes.push(performance.now() - t2);
    }

    console.log(JSON.stringify({ redisGet: { count: redisGetTimes.length, ...summarize(redisGetTimes) }, redisSet: { count: redisSetTimes.length, ...summarize(redisSetTimes) } }, null, 2));
  }

  const mongoFindTimes = [];
  const mongoCountTimes = [];
  for (let i = 0; i < 30; i += 1) {
    const t1 = performance.now();
    await collection.find(query).sort({ createdAt: -1 }).skip(0).limit(12).lean().toArray();
    mongoFindTimes.push(performance.now() - t1);

    const t2 = performance.now();
    await collection.countDocuments(query);
    mongoCountTimes.push(performance.now() - t2);
  }

  console.log(JSON.stringify({ mongoFind: { count: mongoFindTimes.length, ...summarize(mongoFindTimes) }, mongoCount: { count: mongoCountTimes.length, ...summarize(mongoCountTimes) } }, null, 2));

  const appTimes = await measureHttp('/api/events/public', 25, 10);
  console.log(JSON.stringify({ appPublicEvents: appTimes }, null, 2));

  await mongoose.disconnect();
  if (redis?.isOpen) {
    await redis.quit();
  }
};

run().catch((err) => {
  console.error(JSON.stringify({ error: String(err) }, null, 2));
  process.exitCode = 1;
});
