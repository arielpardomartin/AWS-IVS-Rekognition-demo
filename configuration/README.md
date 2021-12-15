## Configuration

### Prerequisites

* [Node.js version 12.0.0 or later](https://nodejs.org/) to run Node scripts
* [AWS account](https://aws.amazon.com/) to create resources
* [AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) to run scripts
* [Git Bash](https://git-scm.com/) to run Bash scripts (only on Windows)

<br>

### Configure debug confidence threshold

You can configure the minimum confidence percentage for recognized labels, so the Rekognition service only returns labels ("boxable" or not) with a confidence score equal to or greater than this percentage. This threshold can be configured by modifying the **debugConfidenceThreshold** field value in the [configuration-parameters.json](configuration-parameters.json) file, which already contains a default configuration, and running the script:

```shell
bash configure-debug-confidence-threshold.sh
```

> **Of note:**<br>
> When performing this configuration, bounding boxes will disappear for a minute or so until the Rekognition service is restarted to take the new value (during this time, the player may restart a couple of times because it is programmed to automatically restart if no data is displayed after 30 seconds).

<br>

### Configure display confidence threshold

You can configure the minimum confidence percentage for bounding boxes, so the Player only displays bounding boxes with a confidence score equal to or greather than this percentage. This threshold can be configured by modifying the **displayConfidenceThreshold** field value in the [configuration-parameters.json](configuration-parameters.json) file, which already contains a default configuration, and running the script:

```shell
bash configure-display-confidence-threshold.sh
```

> **Of note:**<br>
> After executing this script, you will have to reload the page to visualize the new Player version.

<br>

### Configure maximum number of concurrent boxes

You can configure the maximum number of bounding boxes that can be displayed at the same time in the player (up to the maximum allowed by Amazon Rekognition which is 50). This number can be configured by modifying the **maxConcurrentBoxes** field value in the [configuration-parameters.json](configuration-parameters.json) file, which already contains a default configuration, and running the script:

```shell
bash configure-maximum-concurrent-boxes.sh
```

> **Of note:**<br>
> After executing this script, you will have to reload the page to visualize the new Player version.

<br>

## Scripts included in this folder

This section includes details of every script present in this folder for informational purposes. You only need to run the scripts described in the **Configuration** section above.

<br>

### configure-debug-confidence-threshold.sh

Calls the [getConfig.js](#getConfigjs) script to load the `debugConfidenceThreshold` parameter value from the **configuration-parameters.json** file; then, calls the [getStackName.js](#getStackNamejs) script to retrieve the stack name; next, calls the **deployment/setup-images.sh** script with the retrieved values to build and push a new Rekognition service image with the new value of the *DEBUG_CONFIDENCE_THRESHOLD* environment variable; finally, updates the Rekognition service to take the new image using the AWS CLI.

Parameters: None

Example:

```shell
bash configure-debug-confidence-threshold.sh
```

<br>

### configure-display-confidence-threshold.sh

Calls the [getConfig.js](#getConfigjs) script to load the `displayConfidenceThreshold` parameter value from the **configuration-parameters.json** file; then, calls the [getCurrentPlayerEnvVarValue.js](#getCurrentPlayerEnvVarValuejs) script to load the current value of the *REACT_APP_MAX_CONCURRENT_BOXES* env var from the **web-ui/player-app/.env** file; next, calls the **deployment/deploy-player-app.sh** script to deploy the new version with the retrieved values; finally, calls the [getCloudFrontDistributionId.js](#getCloudFrontDistributionIdjs) script to retrieve the CloudFront distribution ID and uses it to update the cached files via AWS CLI.

Parameters: None

Example:

```shell
bash configure-display-confidence-threshold.sh
```

<br>

### configure-maximum-concurrent-boxes.sh

Calls the [getConfig.js](#getConfigjs) script to load the `maxConcurrentBoxes` parameter value from the **configuration-parameters.json** file; then, calls the [getCurrentPlayerEnvVarValue.js](#getCurrentPlayerEnvVarValuejs) script to load the current value of the *REACT_APP_DISPLAY_CONFIDENCE_THRESHOLD* env var from the **web-ui/player-app/.env** file; next, calls the **deployment/deploy-player-app.sh** script to deploy the new version with the retrieved values; finally, calls the [getCloudFrontDistributionId.js](#getCloudFrontDistributionIdjs) script to retrieve the CloudFront distribution ID and uses it to update the cached files via AWS CLI.

Parameters: None

Example:

```shell
bash configure-maximum-concurrent-boxes.sh
```

<br>

### getCloudFrontDistributionId.js

Retrieves the Cloudfront distribution ID from the **deployment/stack.json** file.

Parameters: None

Example:

```shell
node getCloudFrontDistributionId.js
```

<br>

### getConfig.js

Retrieves the value for the provided key from the **configuration-parameters.json** file.

Parameters:
1) KEY (required)

Example:

```shell
node getConfig.js debugConfidenceThreshold
```

<br>

### getCurrentPlayerEnvVarValue.js

Retrieves the value for the provided environment variable name from the **web-ui/player-app/.env** file.

Parameters:
1) ENVIRONMENT_VARIABLE_NAME (required)

Example:

```shell
node getCurrentPlayerEnvVarValue.js REACT_APP_MAX_CONCURRENT_BOXES
```

<br>

### getStackName.js

Retrieves the CloudFormation stack name from the **deployment/stack.json** file.

Parameters: None

Example:

```shell
node getStackName.js
```
