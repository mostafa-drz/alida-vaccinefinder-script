# alida-vaccinefinder-script

This is a simple not clean script for pulling data from https://open.toronto.ca/dataset/covid-19-immunization-clinics/ and pushing to hubspot DB.

## Install and Start

1. clone the repo 
```
git clone https://github.com/mostafa-drz/alida-vaccinefinder-script.git
```
2. Install dependencies
```
npm install
```
3. Create env file
```
touch .env
```
and add the values as mentioned in "The required fields in .env file"

4. Run commands:
```
npm run update -----> It runs the script one time to update the DB
npm run schedule ----> It starts the cron job to update the DB based on SCHEDULE defined in .env file.
```

## The required fields in .env file:
```
PACKAGE_ID= CKAN package ID which you can grab from here: https://open.toronto.ca/dataset/covid-19-immunization-clinics/
TABLE_ID= Hubspot table ID, Marketing has access to it
H_API_KEY=Hubspot API ket, Marketing has access to it
AUTO_PUBLSIH=A flag to publish changes to live version or keep it as draft
SCHEDULE=A cron style string to pass the schedule

```
