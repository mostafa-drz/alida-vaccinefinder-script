const CronJob = require("node-cron");
const { updateData } = require("./index");

if (process.env.SCHEDULE === undefined) {
  throw Error(
    "ENV_MISSING - SCHEDULE - you need to pass a valid cron job schedule"
  );
}
if (!CronJob.validate(process.env.SCHEDULE)) {
  throw Error(
    "ENV_INVALID - SCHEDULE - you need to pass a valid cron job schedule"
  );
}
const SCHEDULE = process.env.SCHEDULE;
CronJob.schedule(SCHEDULE, async function () {
  console.log("-----A new Update goin to start-----");
  updateData();
});
