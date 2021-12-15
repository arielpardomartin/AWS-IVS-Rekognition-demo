#!/bin/bash

IS_CONFIGURING_REKOGNITION=$1
STACKNAME=$2
DEBUG_CONFIDENCE_THRESHOLD=$3

# Validate that the required parameter is given
if [ -z $2 ]; then
	printf "\n\nSTACKNAME parameter is required" && exit 1
fi

# Setup variables
AWS_REGION=$(aws configure get region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
STREAM_REPOSITORY_NAME=ivs-rekognition-demo-stream-images-<RANDOM_SUFFIX>
REKOGNITION_REPOSITORY_NAME=ivs-rekognition-demo-rekognition-images-<RANDOM_SUFFIX>

# Log in into registry
printf "\n\nLogging in into default private registry...\n"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
if [ $? != 0 ]; then exit 1; fi

cd ../serverless

if [ $IS_CONFIGURING_REKOGNITION -eq 0 ]; then
	# Build and push Stream service image
	printf "\n\nCreating image repository for Stream service...\n"
	aws ecr create-repository --repository-name $STREAM_REPOSITORY_NAME
	printf "\n\nBuilding and pushing Stream service image...\n"
	cd ./stream-server
	docker build -q -t $ECR_REGISTRY/$STREAM_REPOSITORY_NAME:latest .
	docker push $ECR_REGISTRY/$STREAM_REPOSITORY_NAME:latest
	if [ $? != 0 ]; then exit 1; fi
	cd ..
fi

# Build and push Rekognition service image
if [ $IS_CONFIGURING_REKOGNITION -eq 0 ]; then
	printf "\n\nCreating image repository for Rekognition service...\n"
	aws ecr create-repository --repository-name $REKOGNITION_REPOSITORY_NAME
fi
printf "\n\nBuilding and pushing Rekognition service image...\n"
cd ./rekognition-server && cp -r ../utils ./src/utils
docker build -q -t $ECR_REGISTRY/$REKOGNITION_REPOSITORY_NAME:latest \
--build-arg ENV_DEBUG_CONFIDENCE_THRESHOLD="$DEBUG_CONFIDENCE_THRESHOLD" .
rm -rf ./src/utils
docker push $ECR_REGISTRY/$REKOGNITION_REPOSITORY_NAME:latest
if [ $? != 0 ]; then exit 1; fi

printf "\n\nECS container images setup complete!\n"