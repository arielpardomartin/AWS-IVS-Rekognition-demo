#!/bin/bash
echo
read -p "Stack name: " STACKNAME
PLAYER_BUCKET=s3://ivs-rekognition-demo-player-app-<RANDOM_SUFFIX>
LAMBDA_FUNCTIONS_BUCKET=s3://ivs-rekognition-demo-lambda-functions-<RANDOM_SUFFIX>
STREAM_REPOSITORY_NAME=ivs-rekognition-demo-stream-images-<RANDOM_SUFFIX>
REKOGNITION_REPOSITORY_NAME=ivs-rekognition-demo-rekognition-images-<RANDOM_SUFFIX>

printf "\nEmptying bucket \"$PLAYER_BUCKET\"...\n"
aws s3 rm $PLAYER_BUCKET --recursive --quiet

printf "\nEmptying bucket \"$LAMBDA_FUNCTIONS_BUCKET\"...\n"
aws s3 rm $LAMBDA_FUNCTIONS_BUCKET --recursive --quiet

# Remove stages to avoid this error when deleting APIs:
# "Active stages pointing to this deployment must be moved or deleted"
printf "\nRemoving API Gateway stages...\n"
node delete-api-stages.js --stackOutputFilePath stack.json

printf "\nRemoving stack \x1b[33m$STACKNAME\x1b[0m...\n"
aws cloudformation delete-stack --stack-name $STACKNAME
aws cloudformation wait stack-delete-complete --stack-name $STACKNAME

printf "\nRemoving bucket \"$LAMBDA_FUNCTIONS_BUCKET\"...\n"
aws s3 rb $LAMBDA_FUNCTIONS_BUCKET --force

printf "\nRemoving ECR repository \"$STREAM_REPOSITORY_NAME\"...\n"
aws ecr delete-repository --repository-name $STREAM_REPOSITORY_NAME --force

printf "\nRemoving ECR repository \"$REKOGNITION_REPOSITORY_NAME\"...\n"
aws ecr delete-repository --repository-name $REKOGNITION_REPOSITORY_NAME --force

printf "\nCleanup complete!\n"