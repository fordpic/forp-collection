# The Forps NFT Collection

This repo contains the code for the core contract of the Forps NFT collection, as well as the frontend code for the UI. If a user has already joined the whitelist, they can directly mint their Forp by simply connecting their whitelisted wallet to the site, connecting to Goerli, and selecting mint.

If users are not on the whitelist for Forps but would like to mint one, they can join here (while spots are available): [Forps Whitelist Site](whitelist-site-swart.vercel.app)

The UI will automatically let users know if they are eligible to mint a Forp or not; **each wallet can mint a maximum of one Forp NFT**.

Forps are viewable on Opensea via an API endpoint in the repo that serves the metadata upon request; be sure to check out your brand new Forp on their site once you've minted!

## Technologies Used

- NextJS for the web framework
- Solidity for the smart contracts
- TailwindCSS for frontend styling
- Ethers for the web3 frontend library
- Hardhat for smart contract deployment
- Quicknode for the RPC endpoint

## Next Steps

Similarly to the closely-related Whitelist repo, this project is currently at MVP but has likely run it's full course. There are a few things that I'd like to add, such as convert the Hardhat deployment and configuration files to TypeScript, as well as utilize Typechain to generate web3-friendly typings for the frontend. However, these are likely things that I will work into my next Solidity-centric projects, not so much this one.

I absolutely loved working my way though this one, so I can definitely see myself doing more web3-related projects in the future.
