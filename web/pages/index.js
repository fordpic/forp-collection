import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Web3Modal from 'web3modal';
import { Contract, providers, utils } from 'ethers';
import { FORPS_ADDRESS, abi } from '../constants/index';

export default function Home() {
	// STATE
	const [walletConnected, setWalletConnected] = useState(false);
	const [presaleStarted, setPresaleStarted] = useState(false);
	const [presaleEnded, setPresaleEnded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [tokenIdsMinted, setTokenIdsMinted] = useState('0');

	// Ref for modal to persist while on page
	const web3ModalRef = useRef();

	// FUNCTIONS
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

	// Helper function for conditional UI rendering
	const renderBtn = () => {
		// If user is not connected
		if (!walletConnected) {
			return (
				<button
					className='h-8 p-8 mb-8 rounded-lg flex mx-auto items-center text-white text-center bg-blue-600'
					onClick={connectWallet}>
					Connect Your Wallet
				</button>
			);
		}

		// When loading
		if (loading) {
			return (
				<button className='h-8 p-8 mb-8 rounded-lg flex mx-auto items-center text-white text-center bg-blue-600'>
					Loading...
				</button>
			);
		}

		// If connected user is owner & presale hasn't started, allow them to start
		if (isOwner && !presaleStarted) {
			return (
				<button
					className='h-8 p-8 mb-8 rounded-lg flex mx-auto items-center text-white text-center bg-blue-600'
					onClick={startPresale}>
					Start The Presale!
				</button>
			);
		}

		// Presale hasn't started & connected user is NOT the owner
		if (!presaleStarted) {
			return (
				<div>
					<div className=''>Presale hasn&#39;t started yet!</div>
				</div>
			);
		}

		// Presale currently going on, allow presale minting for whitelisted addresses
		if (presaleStarted && !presaleEnded) {
			return (
				<div>
					<div className=''>
						Presale has started! If your address is whitelisted, you may mint a
						Forp now while supplies last!
					</div>
					<button
						className='h-8 p-8 mb-8 rounded-lg flex mx-auto items-center text-white text-center bg-blue-600'
						onClick={presaleMint}>
						Presale Mint
					</button>
				</div>
			);
		}

		// Public mint
		if (presaleStarted && presaleEnded) {
			return (
				<button
					className='h-8 p-8 mb-8 rounded-lg flex mx-auto items-center text-white text-center bg-blue-600'
					onClick={publicMint}>
					Mint
				</button>
			);
		}
	};

	// WALLET & RPC CONNECTION HELPERS
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

	return (
		<div>
			<Head>
				<title>Forps</title>
				<meta name='description' content='forps' />
				<link rel='icon' href='/favicon.ico' />
			</Head>

			<div className='min-h-screen flex flex-col text-center justify-center bg-gradient-to-r from-violet-500 to-fuchsia-500'>
				<div>
					<img src='/forp.jpg' className='h-[70%] mx-auto' />
					<h1 className='text-4xl font-extrabold'>Welcome to Forps!</h1>

					<div className='p-4 m-12 mx-40 font-semibold text-white'>
						<span className='font-bold text-blue-600'>Forps</span> is a NFT
						collection that is built entirely for fun and lives on the Goerli
						testnet. They are a not-so-subtle joke of me{' '}
						<span className='font-bold text-blue-600'>(Ford)</span> and the hope
						is to see all of these minted out one day. Once minted, you can swap
						and trade Forps however you see fit!
					</div>

					<div className='p-4 m-12 mx-40 font-semibold text-white'>
						If whitelisted, simply connect your wallet, switch the network to
						Goerli, and mint your{' '}
						<span className='font-bold text-blue-600'>Forp</span>!
					</div>

					<div className='p-4 m-12 mx-40 font-semibold text-white'>
						If you have not joined the whitelist yet, visit the whitelist site{' '}
						<a
							className='font-bold cursor-pointer text-green-500'
							href='https://whitelist-site-swart.vercel.app/'>
							here
						</a>{' '}
						while supplies last!
					</div>

					<div className='m-6 font-semibold text-white'>
						There are {tokenIdsMinted}/20{' '}
						<span className='font-bold text-blue-600'>Forps</span> remaining!
					</div>
					{renderBtn()}
				</div>
			</div>
		</div>
	);
}
