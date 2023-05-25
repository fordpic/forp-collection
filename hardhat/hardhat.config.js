require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: '.env' });

const QUICKNODE_URL = process.env.QUICKNODE;
const PRIVATE_KEY = process.env.PVT_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: '0.8.4',
	networks: {
		goerli: {
			url: QUICKNODE_URL,
			accounts: [PRIVATE_KEY],
		},
	},
};
