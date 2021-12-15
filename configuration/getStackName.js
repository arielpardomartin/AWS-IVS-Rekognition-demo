const fs = require("fs");
const path = require("path");

try {
    const stackDataFile = fs.readFileSync(path.resolve(__dirname, "../deployment/stack.json"), "utf8");
    const stackData = JSON.parse(stackDataFile);
    const stackName = stackData.Stacks[0].StackName;

    if (stackName) {
        console.log(stackName);
    } else {
        throw new Error('Stack name could not be retrieved. Make sure that the deployment/stack.json file exists and run the script again.');
    }
} catch (err) {
    console.error(err);
}