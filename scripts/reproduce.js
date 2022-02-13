const hre = require('hardhat');

const ethers = hre.ethers;

const HTTP_PROVIDER = "https://arb-mainnet.g.alchemy.com/v2/BrAdPf2D7eJt562HvW_Oy4-wxU6pVpL7";

const billAddress = "0x2fa89E09fB311159cc8A4c25bbBFCDE1B355144c";
const stripsAddress = "0xfc03e4a954b7ff631e4a32360caebb27b6849457";

async function resetHardFork(blockNumber) {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: HTTP_PROVIDER,
          blockNumber: blockNumber,
        },
      },
    ],
  });
}

async function impersonate(account) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });
}

async function increaseTime(seconds) {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
}

async function parseTransferEvents(logs) {
  const abi = ["event Transfer(address indexed from, address indexed to, uint value)"];
  const iface = new ethers.utils.Interface(abi); 
  for (const log of logs) {
    // Transfer
    if (log.topics[0]=== "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
      const logDescription = iface.parseLog(log);
      console.log("=============== Transfer ================");
      console.log(`From = ${logDescription.args.from}`);
      console.log(`To = ${logDescription.args.to}`);
      console.log(`Amount = ${logDescription.args.value.div(ethers.utils.parseEther("1")).toNumber()}`);
    }
  }
}

async function getRewardsAt(blockNumber) {
  console.log(`At block ${blockNumber}`);
  await resetHardFork(blockNumber);
  await increaseTime(1);
  await impersonate(billAddress);

  let bill = await ethers.getSigner(billAddress);
  // Claim rewards
  let tx = {
    from: billAddress,
    to: stripsAddress,
    data: 
      "0x8be7febc00000000000000000000000000000000000000000000000000000000" +
      "000000200000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000" +
      "004000000000000000000000000000000000000000000000000000000000000000" +
      "200000000000000000000000002fa89E09fB311159cc8A4c25bbBFCDE1B355144c"
  };
  let response = await bill.sendTransaction(tx);
  let receipt = await response.wait(1);
  
  await parseTransferEvents(receipt.logs);

  console.log("-------------------------------------------");
}

async function main() {
  // Feb-12-2022 06:10:03 PM +UTC
  await getRewardsAt(5936000);

  // Feb-12-2022 07:09:20 PM +UTC
  await getRewardsAt(5939000);
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
