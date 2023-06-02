import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Web3Modal from 'web3modal';
import { Contract, providers, utils } from 'ethers';

export default function Home() {
	// State
	const [walletConnected, setWalletConnected] = useState(false);
	const [presaleStarted, setPresaleStarted] = useState(false);
	const [presaleEnded, setPresaleEnded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [tokenIdsMinted, setTokenIdsMinted] = useState('0');

	// Ref for modal to persist while on page
	const web3ModalRef = useRef();

	// Functions

	// Mint a Forp in presale (must be whitelisted)
	const presaleMint = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const forpsContract = new Contract(FORPS_ADDRESS, abi, signer);

			const txn = await forpsContract.presaleMint({
				value: utils.parseEther('0.01'),
			});

			setLoading(true);
			await txn.wait();
			setLoading(false);
			window.alert('You have successfully minted a Forp!');
		} catch (err) {
			console.error(err);
		}
	};

	// Mint a Forp after the presale (if still available)
	const publicMint = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const forpsContract = new Contract(FORPS_ADDRESS, abi, signer);

			const txn = await forpsContract.publicMint({
				value: utils.parseEther('0.01'),
			});

			setLoading(true);
			await txn.wait();
			setLoading(false);
			window.alert('You have successfully minted a Forp!');
		} catch (err) {
			console.error(err);
		}
	};

	// Checks if presale has started by querying the variable
	const checkIfPresaleStarted = async () => {
		try {
			// Read-only
			const provider = await getProviderOrSigner();
			const forpsContract = new Contract(FORPS_ADDRESS, abi, provider);

			const _presaleStarted = await forpsContract.presaleStarted();
			if (!_presaleStarted) await getOwner();

			setPresaleStarted(_presaleStarted);
			return _presaleStarted;
		} catch (err) {
			console.error(err);
		}
	};

	// Checks if presale has ended by querying the variable
	const checkIfPresaleEnded = async () => {
		try {
			const provider = await getProviderOrSigner();
			const forpsContract = new Contract(FORPS_ADDRESS, abi, provider);

			const _presaleEnded = await forpsContract.presaleEnded();
			// _presaleEnded is a BN, must compare return value in seconds with presaleEnded timestamp to determine
			const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
			hasEnded ? setPresaleEnded(true) : setPresaleEnded(false);

			return hasEnded;
		} catch (err) {
			console.error(err);
			return false;
		}
	};

	// Starts the presale
	const startPresale = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const forpsContract = new Contract(FORPS_ADDRESS, abi, signer);

			const txn = await forpsContract.startPresale();

			setLoading(true);
			await txn.wait();
			setLoading(false);
			await checkIfPresaleStarted();
		} catch (err) {
			console.error(err);
		}
	};

	// Grabs owner of contract
	const getOwner = async () => {
		try {
			const provider = await getProviderOrSigner();
			const forpsContract = new Contract(FORPS_ADDRESS, abi, provider);

			const _owner = await forpsContract.owner();
			// Grab signer now to extract address of currently connected acct
			const signer = await getProviderOrSigner(true);
			const address = await signer.getAddress();

			if (address.toLowerCase() === _owner.toLowerCase()) setIsOwner(true);
		} catch (err) {
			console.error(err);
		}
	};

	// Grabs total # of Forps currently minted (via tokenId)
	const getTokenIdsMinted = async () => {
		try {
			const provider = await getProviderOrSigner();
			const forpsContract = new Contract(FORPS_ADDRESS, abi, provider);

			const _tokenIds = await forpsContract.tokenIds();
			// _tokenIds is a BN, must convert to string first
			setTokenIdsMinted(_tokenIds.toString());
		} catch (err) {
			console.error(err);
		}
	};

	// Wallet & RPC Connection Helpers

	// Get signer or provider RPC object
	const getProviderOrSigner = async (needSigner = false) => {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);

		// Make sure user connected to Goerli
		const { chainId } = await web3Provider.getNetwork();
		if (chainId !== 5) {
			window.alert('Please change the network to Goerli');
			throw new Error('Please change the network to Goerli');
		}

		// Snag signer if needed
		if (needSigner) {
			const signer = web3Provider.getSigner();
			return signer;
		}

		return web3Provider;
	};

	// Connect a MM wallet
	const connectWallet = async () => {
		try {
			await getProviderOrSigner();
			setWalletConnected(true);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		if (!walletConnected) {
			web3ModalRef.current = new Web3Modal({
				network: 'goerli',
				providerOptions: {},
				disableInjectedProvider: false,
			});

			connectWallet();

			// Check on presale status
			const _presaleStarted = checkIfPresaleEnded();
			if (_presaleStarted) checkIfPresaleStarted();

			getTokenIdsMinted();

			// Set an interval to check on presale
			const presaleEndedInterval = setInterval(async function () {
				const _presaleStarted = await checkIfPresaleStarted();

				if (_presaleStarted) {
					const _presaleEnded = await checkIfPresaleEnded();
					if (_presaleEnded) {
						clearInterval(presaleEndedInterval);
					}
				}
			}, 5 * 1000); // 5 seconds

			// Set an interval to get # of tokenIds
			setInterval(async function () {
				await getTokenIdsMinted();
			}, 5 * 1000); // 5 seconds
		}
	}, [walletConnected]);

	return;
}
