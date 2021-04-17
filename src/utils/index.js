function checkENVVariables() {
  if (process.env.PACKAGE_ID === undefined) {
    throw Error("ENV_MISSING - PACKAGE_ID - Package ID can not be undefined");
  }
  if (process.env.TABLE_ID === undefined) {
    throw Error(
      "ENV_MISSING - TABLE_ID - HubSpot table ID can not be undefined"
    );
  }
  if (process.env.H_API_KEY === undefined) {
    throw Error(
      "ENV_MISSING - H_API_KEY - HubSpot table ID can not be undefined"
    );
  }
  if (
    process.env.AUTO_PUBLSIH !== "true" &&
    process.env.AUTO_PUBLSIH !== "false"
  ) {
    throw Error(
      `ENV_INVALID - AUTO_PUBLSIH - AUTO_PUBLSIH can be false or true found ${prcoess.env.AUTO_PUBLSIH}`
    );
  }
}

module.exports = { checkENVVariables };
