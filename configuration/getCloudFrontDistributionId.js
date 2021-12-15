const fs = require("fs");
const path = require("path");

const findOutput = (outputs, key) => {
    return outputs.filter((output) => {
      return output.OutputKey === key;
    })[0].OutputValue;
};

try {
    const stackDataFile = fs.readFileSync(path.resolve(__dirname, "../deployment/stack.json"), "utf8");
    const stackData = JSON.parse(stackDataFile);
    const cloudformationOutputs = stackData.Stacks[0].Outputs;

    const cloudFrontDistributionId = findOutput(
        cloudformationOutputs,
        'CloudFrontPlayerAppDistribution'
      );

    if (cloudFrontDistributionId) {
        console.log(cloudFrontDistributionId);
    } else {
        throw new Error('CloudFront distribution ID could not be retrieved. Make sure that the deployment/stack.json file exists and run the script again.');
    }
} catch (err) {
    console.error(err);
}
