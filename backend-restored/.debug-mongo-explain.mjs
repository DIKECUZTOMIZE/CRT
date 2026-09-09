import mongoose from 'mongoose';
import env from './src/config/env.js';

const uri = env.MONGO_URI;
const url = new URL(uri);
const redacted = new URL(uri);
redacted.username = '***';
redacted.password = '***';

console.log(JSON.stringify({
  host: url.hostname,
  port: url.port || 27017,
  db: url.pathname.replace(/^\//, '') || '(none)',
  redactedUri: redacted.toString(),
  nodeEnv: env.NODE_ENV,
}, null, 2));

const explainResult = async (label, fn) => {
  const start = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - start;
    console.log(JSON.stringify({
      label,
      completed: true,
      elapsedMs: elapsed,
      executionTimeMillis: result?.executionStats?.executionTimeMillis ?? null,
      totalKeysExamined: result?.executionStats?.totalKeysExamined ?? null,
      totalDocsExamined: result?.executionStats?.totalDocsExamined ?? null,
      winningPlan: result?.queryPlanner?.winningPlan ?? null,
      rejectedPlans: result?.queryPlanner?.rejectedPlans ?? null,
      executionStages: result?.executionStats?.executionStages ?? null,
    }, null, 2));
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(JSON.stringify({
      label,
      completed: false,
      elapsedMs: elapsed,
      error: err && err.message ? err.message : String(err),
    }, null, 2));
  }
};

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, retryWrites: false });
  const collection = mongoose.connection.db.collection('events');

  await explainResult('simpleFind', async () => {
    return await collection.find({ status: { $in: ['upcoming', 'live'] } })
      .sort({ createdAt: -1 })
      .limit(12)
      .explain('executionStats');
  });

  const facetQuery = [
    { $match: { status: { $in: ['upcoming', 'live'] } } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        total: [{ $count: 'count' }],
        events: [
          { $skip: 0 },
          { $limit: 12 },
          {
            $project: {
              _id: 1,
              organizerId: 1,
              title: 1,
              category: 1,
              tagline: 1,
              eventMode: 1,
              state: 1,
              city: 1,
              district: 1,
              location: 1,
              pinCode: 1,
              eventDate: 1,
              eventEndDate: 1,
              eventStartTime: 1,
              eventEndTime: 1,
              eventTime: 1,
              totalSeats: 1,
              viewsCount: 1,
              avgRating: 1,
              ratingsCount: 1,
              bannerUrl: 1,
              cardImageUrl: 1,
              status: 1,
              createdAt: 1,
              'organizerContact.name': 1,
              'organizerContact.whatsapp': 1,
              'participation.enabled': 1,
              'participation.mode': 1,
              totalPrizePool: 1,
            },
          },
        ],
      },
    },
  ];

  await explainResult('facetAggregate', async () => {
    return await collection.aggregate(facetQuery, { allowDiskUse: true, maxTimeMS: 5000 }).explain('executionStats');
  });

  await mongoose.disconnect();
} catch (err) {
  console.log(JSON.stringify({
    label: 'connectionSetup',
    connected: false,
    error: err && err.message ? err.message : String(err),
  }, null, 2));
}
