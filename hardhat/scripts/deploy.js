const { ethers } = require('hardhat');
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require('../constants');
require('dotenv').config({ path: '.env' });

async function main() {
	const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
	const metadataURL = METADATA_URL;

	const forpsContract = await ethers.getContractFactory('Forps');
	const deployedForpsContract = await forpsContract.deploy(
		metadataURL,
		whitelistContract
	);
	await deployedForpsContract.deployed();

	console.log('Forps contract address:', deployedForpsContract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
