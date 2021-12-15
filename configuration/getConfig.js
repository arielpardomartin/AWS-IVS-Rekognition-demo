const fs = require("fs");
const path = require("path");

const key = process.argv[2];

try {
    const json = fs.readFileSync(path.resolve(__dirname, "./configuration-parameters.json"), "utf8");
    const jsonObject = JSON.parse(json);
    const value = Object.keys(jsonObject).find((item) => item === key);

    if (value) {
        console.log(jsonObject[value]);
    }
} catch (err) {
    console.error(err);
}
