const fs = require("fs");
const path = require("path");

const ENV_KEY = process.argv[2];

try {
    const playerEnvFile = fs.readFileSync(path.resolve(__dirname, "../web-ui/player-app/.env"), "utf8");
    const regex = new RegExp(`${ENV_KEY}=(.*)\n`);
    const envValue = playerEnvFile.match(regex)[1];
    
    if (envValue) {
        console.log(envValue);
    } else {
        throw new Error(`Value for Player env var "${ENV_KEY}" could not be retrieved. Make sure that the web-ui/player-app/.env file exists and run the script again.`);
    }
} catch (err) {
    console.error(err);
}