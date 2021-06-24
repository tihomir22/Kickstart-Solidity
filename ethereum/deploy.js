const HDWalletProvider = require("truffle-hdwallet-provider");
require("dotenv").config();
const Web3 = require("web3");
const instanceFactory = require("./build/FactoryKickstart.json")

const provider = new HDWalletProvider(process.env.NEUMONIC, "https://rinkeby.infura.io/v3/56db03b29f7e42c4a2b892a70ad5ad97");
const web3 = new Web3(provider);

let interface =instanceFactory.abi;
let bytecode = instanceFactory.evm.bytecode.object;

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  console.log("Attempting to deploy from account", accounts[0]);

  let contract = await new web3.eth.Contract(interface).deploy({ data: bytecode }).send({ gas: "3000000", from: accounts[0] });

  console.log(interface);
  console.log("Deployed hash", contract.options.address);
};

deploy();
