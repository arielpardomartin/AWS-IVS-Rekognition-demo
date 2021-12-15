#!/bin/bash

CLUSTER_NAME=ivs-rekognition-demo-cluster-<RANDOM_SUFFIX>
SERVICE_NAME=ivs-rekognition-demo-rekognition-service-<RANDOM_SUFFIX>

printf "\nLoading new debug confidence threshold value from file 'configuration/configuration-parameters.json'...\n"
DEBUG_CONFIDENCE_THRESHOLD=$(node getConfig.js debugConfidenceThreshold)

printf "\nRetrieving stack name...\n"
STACKNAME=$(node getStackName.js)

printf "\nBuilding and pushing Rekognition service image...\n"
bash ../deployment/setup-images.sh \
1 \
$STACKNAME \
$DEBUG_CONFIDENCE_THRESHOLD

printf "\nUpdating service with the new image...\n"
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment
if [ $? != 0 ]; then exit 1; fi

printf "\nService successfully updated!\n"