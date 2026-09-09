import EventModel from "/app/src/model/event.model.js";
import connectDB, { closeDB } from "/app/src/config/database.js";

const simplifyPlan = (plan) => {
  const executionStats = plan?.executionStats ?? {};
  const stages = executionStats.executionStages ?? {};

  return {
    winningPlan: plan?.queryPlanner?.winningPlan ?? null,
    executionTimeMillis: executionStats.executionTimeMillis ?? null,
    totalDocsExamined: executionStats.totalDocsExamined ?? null,
    totalKeysExamined: executionStats.totalKeysExamined ?? null,
    nReturned: executionStats.nReturned ?? null,
    stage: stages.stage ?? null,
    inputStage: stages.inputStage ?? null,
    indexName: stages.inputStage?.indexName ?? stages.indexName ?? null,
  };
};

await connectDB();

const indexes = await EventModel.collection.listIndexes().toArray();
const match = { status: { $in: ["upcoming", "live"] } };
const findPlan = await EventModel.collection.find(match).sort({ createdAt: -1 }).limit(12).explain("executionStats");
const countPlan = await EventModel.collection.find(match).explain("executionStats");

console.log(JSON.stringify({
  indexes,
  findQueryPlan: simplifyPlan(findPlan),
  countQueryPlan: simplifyPlan(countPlan),
}, null, 2));

await closeDB();
