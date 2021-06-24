const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const compiledFactory = require("../ethereum/build/FactoryKickstart.json");
const compiledCampaign = require("../ethereum/build/KickstartContract.json");

let accounts;
let campaign;
let factory;
let campaignAddress;

function getBytecode(contract) {
  return contract.evm.bytecode.object;
}

function getInterface(contract) {
  return contract.abi;
}

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  factory = await new web3.eth.Contract(getInterface(compiledFactory))
    .deploy({ data: getBytecode(compiledFactory) })
    .send({ from: accounts[0], gas: "3000000" });

  await factory.methods.createCampaign("100").send({
    from: accounts[0],
    gas: "3000000",
  });

  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();

  campaign = await new web3.eth.Contract(getInterface(compiledCampaign), campaignAddress);
});

describe("Campaigns", () => {
  it("deploys a factory and a campaign", () => {
    assert.ok(factory.options.address);
    assert.ok(factory.options.address);
  });

  it("marks caller as the campaign manager", async () => {
    const manager = await campaign.methods.manager().call();
    assert.equal(accounts[0], manager);
  });

  it("allows people to contribute money and marks them as approvers", async () => {
    await campaign.methods.contribute().send({
      value: "200",
      from: accounts[1],
    });
    const isContributor = await campaign.methods.approvers(accounts[1]);
    assert(isContributor);
  });

  it("requires a minimum contribution", async () => {
    try {
      await campaign.methods.contribute().send({
        value: "5",
        from: accounts[1],
      });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("allows a manager to make a payment request", async () => {
    await campaign.methods.createRequest("Buy batteries maybe?", 100, accounts[1]).send({ from: accounts[0], gas: "3000000" });
    const request = await campaign.methods.requests(0).call();
    assert.strictEqual("Buy batteries maybe?", request.description);
  });

  it("processes requests", async () => {
    let balanceBefore = await web3.eth.getBalance(accounts[1]);
    await campaign.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei("10", "ether"),
    });

    await campaign.methods.createRequest("A", web3.utils.toWei("5", "ether"), accounts[1]).send({ from: accounts[0], gas: "3000000" });

    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: "3000000",
    });

    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: "3000000",
    });

    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, "ether");
    balanceBefore = web3.utils.fromWei(balanceBefore, "ether");
    balance = parseFloat(balance);
    balanceBefore = parseFloat(balanceBefore);
    assert(balance > balanceBefore);
  });
});
