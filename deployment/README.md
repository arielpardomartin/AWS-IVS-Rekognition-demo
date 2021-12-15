## Deployment

### Prerequisites

* [Node.js version 12.0.0 or later](https://nodejs.org/) to run Node scripts
* [AWS account](https://aws.amazon.com/) to create resources
* [AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) to run scripts
* [Git Bash](https://git-scm.com/) to run Bash scripts (only on Windows)
* [Docker version 20.10.5 or later](https://www.docker.com/) and Docker daemon up and running to build and push ECS container images

<br>

### 1) Assign random suffix to resource names

Run `bash assign-random-suffix.sh`.

This will generate a 6 character length alphanumeric value. Then, it will update the [cloudformation.yaml](./cloudformation.yaml) file and bash script files by replacing the placeholder `<RANDOM_SUFFIX>`, located at the end of the resource names, with the random value generated to ensure uniqueness.

> **Note:**<br>
> There is no script to reverse this step, but you can use Git to discard all changes and go back to the original state.

<br>

### 2) Configure AWS CLI

Run `aws configure` to set your credentials and the region where you want the demo resources deployed.

<br>

### 3) Run deployment script

Run `bash deploy.sh`.

This will deploy the demo infrastructure in AWS with the default values for the configurable parameters.

> **Note:**<br>
> On MacOS, some steps of the deployment show large outputs that require you to press "q" to continue with the deployment execution.

In case of failure, check the script outputs and the CloudFormation console. Common issues are:
* The Docker daemon is not running (check [how to configure and troubleshoot the Docker daemon](https://docs.docker.com/config/daemon/))
* A service quota has been reached (check [AWS service quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html))<br>

After solving the issue, run the cleanup script and then the deployment script again (some error messages stating that the resources could not be deleted may arise during the cleanup process if the deployment was made partially).

<br>

## Usage

### How to stream

At the end of the deploy.sh execution, you will see the following output in the console:

![outputs](img/outputs.jpg)

Use the **Stream Server URL** and the **Stream Key** values to configure your streaming tool (we are using [OBS](https://obsproject.com/) in this example):

![OBS Config](img/obs-config.jpg)

Check that you have the following Output settings: 

* **Bitrate:** `2500 Kbps`
* **Keyframe Interval:** `2`
* **CPU Usage:** `veryfast`
* **Tune:** `zerolatency`

![OBS Outputs](img/obs-outputs.jpg)

<br>

### How to visualize the stream

Open up the player using the **Player URL** value provided in the console output:

![player](img/player.jpg)

<br>

#### Labels Info

You can enable the labels info tab where you can see the list of both the labels that are being displayed as boxes (i.e. labels that are recognized and have clear boundaries) and the labels that are not being displayed (i.e. labels that are recognized, but do not have clear boundaries, like "architecture", "nature", etc.). In order to do this, open up the **Player Settings** dialog box by clicking the button located at the bottom right (the one with the 3 dots) and check the **Show labels info** option:

![labels-info](img/labels-info.jpg)

<br>

#### Latency Slider

If bounding boxes are out of phase (i.e. they are displayed ahead or before the object's current position), you can adjust the latency manually instead of using the [default latency](#how-is-the-default-latency-calculated). In order to do this, open up the **Player Settings** dialog box by clicking the button located at the bottom right (the one with the 3 dots) and check the **Enable latency slider** option. This will add a slider in the Player Controls section with the current default latency value selected with a range of +-3 seconds so you can move the slider to accurately synchronize bounding boxes:

![latency-slider](img/latency-slider.jpg)

> **Note:**<br>
> When the latency slider is enabled, the latency is fixed to the selected value. If disabled, the latency will use the default value again.

As it can be seen in the previous image, the default latency had a value of **3**, and by manually changing it to **1.5**, bounding boxes could be accurately synchronized:

![latency-slider-2](img/latency-slider-2.jpg)

<br>

#### Configuration

Optionally, you can configure [certain aspects of the demo](../configuration/README.md).

<br>

#### How is the default latency calculated?

The default latency is calculated by sending a message with the current milliseconds since Epoch from the Stream service hosted in ECS to connected clients via IVS Timed Metadata. Then, when the message is received by the client, it gets the current milliseconds since Epoch and subtracts the value received from the server to the value retrieved when the message was received. The resulting value is the *default latency*. This operation is performed in a 1 second interval to keep the latency constantly updated. However, most of the times, this value is not fully accurate and it needs to be adjusted manually using the latency slider as explained above.

<br>

## Cleanup

Run `bash cleanup.sh`.

This will remove all the resources created during the execution of `deploy.sh`.

<br>

## Scripts included in this folder

This section includes details of every script present in this folder for informational purposes, you need only to run the scripts described in the **Deployment** and **Cleanup** sections above.

<br>

### generate-player-app-env-vars.js

Creates a file with the environment variables for the player-app, after obtaining them from the output file of the CloudFormation deployment (i.e. `stack.json`). This script is called by the [deploy-player-app.sh](#deploy-player-appsh) script.

Parameters:
1) STACK_FILE_PATH (required)

Example:

```shell
node generate-player-app-env-vars.js stack.json
```

<br>

### deploy-player-app.sh

Calls the [generate-player-app-env-vars.js](#generate-player-app-env-varsjs) script to create the .env file with the corresponding environment variables. Then, the required dependencies are installed and the application is built using the previously generated environment variables. Finally, the build files are uploaded to an S3 bucket. This script is called by the [deploy.sh](#deploysh) script.

Parameters:
1) STACK_FILE_PATH (required)

Example:

```shell
bash deploy-player-app.sh stack.json
```

<br>

### setup-images.sh

If the `IS_CONFIGURING_REKOGNITION` parameter is 0, creates the repositories in the Amazon ECR private registry to host the Stream and Rekognition containers images. Then, logs in into the registry and uses the [Stream Dockerfile](../serverless/stream-server/Dockerfile) and [Rekognition Dockerfile](../serverless/rekognition-server/Dockerfile) to build and push the corresponding images. If the `IS_CONFIGURING_REKOGNITION` parameter is 1, repository creation will be skipped and only the Rekognition Server image will be built and pushed.
This script is called by the [deploy.sh](#deploysh) script with `IS_CONFIGURING_REKOGNITION = 0` and by the [configure-debug-confidence-threshold.sh](../configuration/configure-debug-confidence-threshold.sh) script with `IS_CONFIGURING_REKOGNITION = 1`.

Parameters: 
1) IS_CONFIGURING_REKOGNITION (required)
2) STACKNAME (required)
3) DEBUG_CONFIDENCE_THRESHOLD (required)

Example:

```shell
bash setup-images.sh
```

<br>

### setup-lambdas.sh

Generates a zip file for each Lambda function located within the [serverless folder](../serverless) by calling the [zip-generator.js](#zip-generatorjs) script. Then, creates an S3 bucket and uploads the Lambda functions zip files into it. This script is called by the [deploy.sh](#deploysh) script.

Parameters: None

Example:

```shell
bash setup-lambdas.sh
```

<br>

### create-stack.sh

Creates the CloudFormation stack using the specified stack name and the [cloudformation.yaml file](./cloudformation.yaml). This script is called by the [deploy.sh](#deploysh) script.

Parameters:
1) STACKNAME (required)

Example:

```shell
bash create-stack.sh ivs-rekognition-demo-stack
```

<br>

### zip-generator.js

Generates a zip file for each specified folder. This script is called by the [setup-lambdas.sh](#setup-lambdassh) script.

Parameters:
* FOLDER_PATH (variable)

Example:

```shell
node zip-generator.js ../serverless/lambda-on-connect ../serverless/lambda-on-disconnect ../serverless/lambda-send-message
```

<br>

### deploy.sh

Main script used to perform the demo deployment. It calls the following scripts:

1) [setup-lambdas.sh](#setup-lambdassh)
2) [setup-images.sh](#setup-imagessh)
3) [create-stack.sh](#create-stacksh)
4) [deploy-player-app.sh](#deploy-player-appsh)
5) [generate-output.js](#generate-outputjs)

Parameters: None

Example:

```shell
bash deploy.sh
```

<br>

### cleanup.sh

Removes all the demo resources that were created by [deploy.sh](#deploysh).

Parameters: None

Example:

```shell
bash cleanup.sh
```

<br>

### assign-random-suffix.sh

Generates a 6 character length alphanumeric value and assigns it to every `<RANDOM_SUFFIX>` placeholder located in the following files:

* [configure-debug-confidence-threshold.sh](../configuration/configure-debug-confidence-threshold.sh)
* [configure-display-confidence-threshold.sh](../configuration/configure-display-confidence-threshold.sh)
* [configure-maximum-concurrent-boxes.sh](../configuration/configure-maximum-concurrent-boxes.sh)
* [setup-images.sh](./setup-images.sh)
* [setup-lambdas.sh](./setup-lambdas.sh)
* [deploy-player-app.sh](./deploy-player-app.sh)
* [cleanup.sh](./cleanup.sh)
* [cloudformation.yaml](./cloudformation.yaml)

Parameters: None

Example:

```shell
bash assign-random-suffix.sh
```

<br>

### generate-output.js

Generates the outputs needed to run the demo, specifically:

* **Stream Server URL**
* **Stream Key**
* **Player URL**

To retrieve the values, it uses the CloudFormation *stack.json* output file and the AWS SDK. This script is called by [deploy.sh](#deploysh) after deploying all the needed resources.

Parameters:
* `--stackOutputFilePath`: Path to CloudFormation output file (required).

Example:

```shell
node generate-output.js --stackOutputFilePath stack.json
```

<br>

### delete-api-stages.js

Deletes the **demo** stage created for both API Gateways (Reader WebSocket and Writer WebSocket). This script is called by the [cleanup.sh](#cleanupsh) script prior to remove the stack.

Parameters:
* `--stackOutputFilePath`: Path to CloudFormation output file (required).

Example:

```shell
node delete-api-stages.js --stackOutputFilePath stack.json
```