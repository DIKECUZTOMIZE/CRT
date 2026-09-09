import { performance, monitorEventLoopDelay } from 'node:perf_hooks';

import createApp from '../src/app.js';
import connectDB, { closeDB } from '../src/config/database.js';
import { connectRedis, getRedisClient, closeRedis } from '../src/config/redis.js';
import { getPublicEventsService } from '../src/module/event/event.service.js';
import EventModel from '../src/model/event.model.js';

const mode = process.argv.includes('--under-load') ? 'under-load' : 'baseline';

const summarize = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (pct) => {
    const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1));
    return sorted[index];
  };

  return {
    samples: values.length,
    avg: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
    p50: values.length ? pick(50) : 0,
    p90: values.length ? pick(90) : 0,
    p95: values.length ? pick(95) : 0,
    p99: values.length ? pick(99) : 0,
    max: values.length ? sorted[sorted.length - 1] : 0,
  };
};

const query = { status: { $in: ['upcoming', 'live'] } };

const measureRedis = async () => {
  const redis = getRedisClient();
  const redisGets = [];
  const redisSets = [];

  for (let i = 0; i < 30; i += 1) {
    const t0 = performance.now();
    await redis.get('public:events:default:1:12');
    redisGets.push(performance.now() - t0);

    const t1 = performance.now();
    await redis.set('public:events:probe:measure', String(Date.now()), { EX: 5 });
    redisSets.push(performance.now() - t1);
  }

  return {
    redis_get_ms: summarize(redisGets),
    redis_set_ms: summarize(redisSets),
  };
};

const measureMongo = async () => {
  const mongoFinds = [];
  const mongoCounts = [];

  for (let i = 0; i < 20; i += 1) {
    const t0 = performance.now();
    await EventModel.find(query)
      .select({ title: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(12)
      .lean();
    mongoFinds.push(performance.now() - t0);

    const t1 = performance.now();
    await EventModel.countDocuments(query);
    mongoCounts.push(performance.now() - t1);
  }

  return {
    mongo_find_ms: summarize(mongoFinds),
    mongo_count_ms: summarize(mongoCounts),
  };
};

const measureService = async () => {
  const serviceSamples = [];
  const eeld = monitorEventLoopDelay({ resolution: 10 });
  eeld.enable();

  const startCpu = process.cpuUsage();
  const startAt = performance.now();

  for (let i = 0; i < 20; i += 1) {
    const t0 = performance.now();
    await getPublicEventsService({}, { page: 1, limit: 12 });
    serviceSamples.push(performance.now() - t0);
  }

  const elapsed = performance.now() - startAt;
  const cpuDelta = process.cpuUsage(startCpu);
  const cpuPercent = ((cpuDelta.user + cpuDelta.system) / (elapsed * 1000)) * 100;
  const mem = process.memoryUsage();
  const loopStats = {
    mean: Number((eeld.mean / 1e6).toFixed(3)),
    p95: Number((eeld.percentile(95) / 1e6).toFixed(3)),
    max: Number((eeld.max / 1e6).toFixed(3)),
  };
  eeld.disable();

  return {
    service_getPublicEventsService_ms: summarize(serviceSamples),
    event_loop_delay_ms: loopStats,
    node_cpu_percent: Number(cpuPercent.toFixed(2)),
    node_memory_rss_mb: Number((mem.rss / 1024 / 1024).toFixed(2)),
    node_heap_used_mb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
  };
};

const measureRoute = async () => {
  const app = createApp();
  const server = app.listen(3314);
  await new Promise((resolve) => server.once('listening', resolve));
  const routeSamples = [];

  try {
    for (let i = 0; i < 20; i += 1) {
      const t0 = performance.now();
      const res = await fetch('http://localhost:3314/api/events/public?page=1&limit=12');
      const body = await res.text();
      routeSamples.push(performance.now() - t0);

      if (res.status !== 200) {
        console.log(JSON.stringify({ unexpectedStatus: res.status, preview: body.slice(0, 200) }, null, 2));
      }
    }
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }

  return {
    route_total_http_ms: summarize(routeSamples),
  };
};

const main = async () => {
  console.log(JSON.stringify({ mode }, null, 2));

  await connectDB();
  await connectRedis();

  const redisMetrics = await measureRedis();
  const mongoMetrics = await measureMongo();
  const serviceMetrics = await measureService();
  const routeMetrics = await measureRoute();

  console.log(JSON.stringify({
    ...redisMetrics,
    ...mongoMetrics,
    ...serviceMetrics,
    ...routeMetrics,
  }, null, 2));

  await closeDB();
  await closeRedis();
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
