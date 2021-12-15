#!/bin/bash

STACK_FILE_PATH=$1
DISPLAY_CONFIDENCE_THRESHOLD=$2
MAX_CONCURRENT_BOXES=$3

# Validate that the required parameters are given
if [ -z $STACK_FILE_PATH ]; then
	printf "\n\nSTACK_FILE_PATH parameter is required" && exit 1
fi

if [ -z $DISPLAY_CONFIDENCE_THRESHOLD ]; then
    printf "\n# Error: Value for DISPLAY_CONFIDENCE_THRESHOLD not found.\n" && exit 1
fi

if [ -z $DISPLAY_CONFIDENCE_THRESHOLD ] || [ -z $MAX_CONCURRENT_BOXES ]; then
    printf "\n# Error: Value for MAX_CONCURRENT_BOXES not found.\n" && exit 1
fi

S3_BUCKET_URI=s3://ivs-rekognition-demo-player-app-<RANDOM_SUFFIX>/

printf "\n\nGenerating environment variables file for Player App..."
node generate-player-app-env-vars.js $STACK_FILE_PATH $DISPLAY_CONFIDENCE_THRESHOLD $MAX_CONCURRENT_BOXES
if [ $? != 0 ]; then exit 1; fi

printf "\n\nInstalling Player App dependencies..."
cd ../web-ui/player-app
npm i --silent

printf "\n\nBuilding Player App..."
npm run env -- env-cmd -f .env react-scripts build --silent

printf "\n\nUploading build files..."
aws s3 cp build $S3_BUCKET_URI --recursive --only-show-errors
cd ../../deployment
if [ $? != 0 ]; then exit 1; fi

printf "\n\nPlayer App deployment complete!\n"