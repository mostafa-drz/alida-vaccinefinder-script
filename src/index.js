require("dotenv").config();
const fs = require("fs");
if (process.env.PACKAGE_ID === undefined) {
  throw Error("Package ID can not be undefined");
}
const https = require("https"),
  packageId = process.env.PACKAGE_ID;

// promise to retrieve the package
const getPackage = new Promise((resolve, reject) => {
  https.get(
    `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=${packageId}`,
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
    console.log(`Received the package`, packageId);
  })
  .catch((error) => {
    console.error(error);
  });
// since this package has resources in the datastore, one can get the data rather than just the metadata of the resources
// promise to retrieve data of a datastore resource
const getDatastoreResource = (resource) =>
  new Promise((resolve, reject) => {
    const RESOURCE_URL = `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search?id=${resource["id"]}`;
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
        const data = resource.map((r) => ({
          locationName: r.locationName,
          locationType: r.locationType,
          address: r.address,
          info: r.info,
          phone: r.phone,
          website: r.website,
          geometry: r.geometry,
        }));
        fs.writeFileSync("raw.json", JSON.stringify(resource));
        fs.writeFileSync("resource.json", JSON.stringify(data));
        //console.log(resource);
      })
      .catch((error) => {
        console.error(error);
      });
  })
  .catch((error) => {
    console.error(error);
  });
