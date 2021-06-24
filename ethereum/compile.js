const path = require("path");
const fs = require("fs-extra");
const solc = require("solc");

const buildPath = path.resolve(__dirname, "build");
fs.removeSync(buildPath);

const campaignPath = path.resolve(__dirname, "contracts", "Campaing.sol");
const source = fs.readFileSync(campaignPath, "utf-8");

let input = {
  language: "Solidity",
  sources: {
    "Campaign.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input))).contracts["Campaign.sol"];
fs.ensureDirSync(buildPath);
for (const contract in output) {
  fs.outputJSONSync(path.resolve(buildPath, contract + ".json"), output[contract]);
}
