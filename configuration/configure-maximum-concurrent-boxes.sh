#!/bin/bash

CLUSTER_NAME=ivs-rekognition-demo-cluster-<RANDOM_SUFFIX>
SERVICE_NAME=ivs-rekognition-demo-rekognition-service-<RANDOM_SUFFIX>

printf "\nLoading new maximum concurrent boxes value from file 'configuration/configuration-parameters.json'...\n"
MAX_CONCURRENT_BOXES=$(node getConfig.js maxConcurrentBoxes)

printf "\nLoading current display confidence threshold value from file 'web-ui/player-app/.env'...\n"
DISPLAY_CONFIDENCE_THRESHOLD=$(node getCurrentPlayerEnvVarValue.js REACT_APP_DISPLAY_CONFIDENCE_THRESHOLD)

printf "\nBuilding and deploying Player application...\n"
cd ../deployment
bash deploy-player-app.sh stack.json $DISPLAY_CONFIDENCE_THRESHOLD $MAX_CONCURRENT_BOXES
cd ../configuration

printf "\nRetrieving CloudFront distribution ID...\n"
CLOUDFRONT_DISTRIBUTION_ID=$(node getCloudfrontDistributionId.js)

printf "\nInvalidating cached files from CloudFront distribution...\n"
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    1> /dev/null
if [ $? != 0 ]; then exit 1; fi

printf "\nPlayer successfully updated! Please, reload page to visualize the new version.\n"