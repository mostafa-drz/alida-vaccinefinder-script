require("dotenv").config();
const fs = require("fs");
const request = require("request");
const https = require("https");
const hubspot = require("@hubspot/api-client");
const CronJob = require("node-cron");
const { checkENVVariables } = require("./src/utils");
checkENVVariables();

const hubspotClient = new hubspot.Client({ apiKey: process.env.H_API_KEY });

const PACKAGE_ID = process.env.PACKAGE_ID;
// promise to retrieve the package
const getPackage = new Promise((resolve, reject) => {
  https.get(
    `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=${PACKAGE_ID}`,
    (response) => {
      let dataChunks = [];
      response
        .on("data", (chunk) => {
          dataChunks.push(chunk);
        })
        .on("end", () => {
          let data = Buffer.concat(dataChunks);
          resolve(JSON.parse(data.toString())["result"]);
        })
        .on("error", (error) => {
          reject(error);
        });
    }
  );
});

getPackage
  .then((pkg) => {
    // this is the metadata of the package
    console.log(`Received the package`, PACKAGE_ID);
  })
  .catch((error) => {
    console.error(error);
  });
// since this package has resources in the datastore, one can get the data rather than just the metadata of the resources
// promise to retrieve data of a datastore resource
const getDatastoreResource = (resource) =>
  new Promise((resolve, reject) => {
    const RESOURCE_URL = `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search?id=${resource["id"]}&limit=32000`;
    console.log("Resource URL", RESOURCE_URL);
    https.get(RESOURCE_URL, (response) => {
      let dataChunks = [];
      response
        .on("data", (chunk) => {
          dataChunks.push(chunk);
        })
        .on("end", () => {
          let data = Buffer.concat(dataChunks);
          resolve(JSON.parse(data.toString())["result"]["records"]);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  });

// get the package information again
function main() {
  getPackage
    .then((package) => {
      // get the datastore resources for the package
      let datastoreResources = package["resources"].filter(
        (r) => r.datastore_active
      );

      // retrieve the first datastore resource as an example
      getDatastoreResource(datastoreResources[0])
        .then((resource) => {
          // this is the actual data of the resource
          const data = resource.map((r) => {
            const geom = r.geometry ? JSON.parse(r.geometry) : null;
            return {
              values: {
                locationname: r.locationName,
                locationtype: r.locationType,
                address: r.address,
                info: r.info,
                phone: r.phone,
                website: r.website,
                location: geom
                  ? {
                      long: geom.coordinates[0],
                      lat: geom.coordinates[1],
                      type: "location",
                    }
                  : null,
              },
            };
          });
          insertDataInDB(data)
            .then(() => {
              console.log(
                `The data insertion is done, ${data.length} rows inserted in the table with id ${process.env.TABLE_ID}`
              );
            })
            .catch((error) => {
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    })
    .catch((error) => {
      console.error(error);
    });
}

async function insertDataInDB(data) {
  try {
    await deleteAllRows();
    const resp = await hubspotClient.cms.hubdb.rowsBatchApi.batchCreateDraftTableRows(
      process.env.TABLE_ID,
      {
        inputs: data,
      }
    );
    console.log(
      `${resp.body.results.length} records inserted in table ${process.env.TABLE_ID}`
    );
    if (!!process.env.AUTO_PUBLSIH === true) {
      publishDraftTable();
    }
  } catch (error) {
    console.error(error);
  }
}

async function deleteAllRows() {
  try {
    const ids = await getAllRowsIDs();
    await hubspotClient.cms.hubdb.rowsBatchApi.batchPurgeDraftTableRows(
      process.env.TABLE_ID,
      { inputs: ids }
    );
    console.log(`Removed ${ids.length} records from ${process.env.TABLE_ID}`);
  } catch (error) {
    console.error(error);
  }
}

async function getAllRowsIDs() {
  try {
    const response = await hubspotClient.cms.hubdb.rowsApi.readDraftTableRows(
      process.env.TABLE_ID
    );
    const results = response.body.results;
    const ids = results.map((r) => r.id);
    return ids;
  } catch (error) {
    console.error(error);
  }
}

async function publishDraftTable() {
  try {
    const resp = await hubspotClient.cms.hubdb.tablesApi.publishDraftTable(
      process.env.TABLE_ID
    );
    console.log(
      `Draft table published successfully -  table id ${process.env.TABLE_ID}`
    );
  } catch (error) {
    console.error(error);
  }
}

main();

const SCHEDULE = process.env.SCHEDULE || "0 */6 * * *";

CronJob.schedule(SCHEDULE, function () {
  console.log("-----A new Update goin to start-----");
  main();
  console.log("-----Update Job completed-----");
});
