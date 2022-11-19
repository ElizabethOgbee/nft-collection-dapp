import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { Contract, providers, utils } from "ethers";
import React, { useEffect, useRef, useState } from 'react';
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
//walletConnected keep track of wheather the user's wallet is connected or not
const [walletConnected, setWalletConnected] = useState(false);
//presaleStarted keep track of whether the presale has started or not
const [presaleStarted, setPresaleStarted] = useState(false);
//presaleEnded keeps track of whether the presale has ended
const [presaleEnded, setPresaleEnded] = useState(false);
//loading is set to true when we are waiting for a transaction 
const [loading, setLoading] = useState(false);
//check if the currently connected metask wallet is the owner of the contract
const [isOwner, setIsOwner] = useState(false);
//tokenIdMinted keeps track of of the number of tokenId that have been minted
const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
const web3ModalRef = useRef();


/**
 * presaleMint: Mint on NFT during the presale
 */
const presaleMint = async() =>{
  try{
    //we need a signer here since this is a `write` transaction
    const signer = await getProviderOrSigner(true);
    //create a new instance of the contract with a signer, which allows
    //update method
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      signer
      );
      //call the presaleMint from the contract, only whitelisted addreses will be able to mint
      const tx = await nftContract.presaleMint({
        //value signifies the cost of one crypto dev which is "0.01" matic.
        //we are parsin `0.01` to ether using the utils library from ether.js
        value: utils.parseEther("0.2")
      });
      setLoading(true);
      //wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
  }
  catch(err){
    console.log(err);
  }
};

/**
 * publicMint: mint on NFT after the presale
 * 
 */
const publicMint = async () => {
  try{
    //we need a signer here since this is a `write` transaction
    const signer = await getProviderOrSigner(true);
    //create a new instance of the contract with a signer,
    //which allows update methods
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      signer
      );
      //call the mint from the contract to mint the Crypto Dev
      const tx = await nftContract.mint({
        //value signifies the cost of one crypto dev which is "0.01" matic.
        //we are parsing the `0.01` string to matic using the utils library
        value: utils.parseEther("0.2"),

      });
      setLoading(true);
      //waiting for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
  }
  catch(err){
    console.error(err);
  }
};

/**
 * connectWallet: Connects the metamask wallet
 */
const connectWallet = async () =>{
  try{
    //Get the provider from web3Modal, which in our case is metamask
    //when used for the first time, it prompts the user to connects their wallet
    await getProviderOrSigner();
    setWalletConnected(true);
  }
  catch (err) {
    console.error(err);
    }
  };

  /**
   * startsPresale: starts the presale for the NFT Collection
   */
  const startPresale = async () =>{
    try{
      //we need a signer here since this is a `write` transaction.
      const signer = await getProviderOrSigner(true);
      //create a new instance of the Contract with a Signer, which allows update method
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
         abi,
          signer);
      //call the startPresale from the contract
      const tx = await nftContract.startPresale();
      setLoading(true);
      //waiting for the transaction to get mined
      await tx.wait();
      setLoading(false);
      //set the presale started to true
      await checkIfPresaleStarted();
    }
    catch(err){
      console.error(err);
    }
  };

  /**
   * CheckIfPreSaleStarted: checkes if the presale has started by querrying the`presaleStarted`
   * variable in the contract
   */
  const checkIfPresaleStarted = async() =>{
    try{
      //get the provider from web3Modal, which in our case is metamask
      //no need for the Signer here, as we are only reading state from the Blockchain
      const provider = await getProviderOrSigner();
      //We connect to the Contract using a Provider, as we will only
      //Read-Only from the Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      )
      //call the presaleStrated from the Contract
      const _presaleStarted = await nftContract.presaleStarted();
      if(!_presaleStarted){
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    }
      catch(err){
        console.error(err);
        return false;
    }
  };

  /**
   * checkIfPresaleEnded: checkes if the presale has ended by queerying the `presaleEnded`
   * variable in the contract
   */

  const checkIfPresaleEnded = async () => {
    try{
      // Get the provifer from web3Modal, which in our case is metamask
      //No need fr the Signer here, as we are only reading state frpm the Blockchain
      const provider = await getProviderOrSigner();
      //We connect to the Contract uding a Provider, so we will only have Read-Only
      // access to the contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
         abi,
          provider);
          //call thepresaleEnded from the Contract
          const _presaleEnded = await nftContract.presaleEnded();
          //_preSaleEnded is a Big Number, so we are using the Lt(Less than function) instead of `<`
          //Date.now()/1000 returns the current time in seconds
          //We compare if the _presaleEnded timestamp is less than the current time
          //which means presale has ended

          const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
          if(hasEnded){
            setPresaleEnded(true);
          }
          else{
            setPresaleEnded(false);
          }
          return hasEnded;
    }
    catch(err){
      console.error(err);
      return false;
    }
  };

  /**
   * getOwner: calls the contract to retrieve the owner
   */
  const getOwner = async () =>{
    try{
      //get thr provider from the web3Modal, ehich in our case is the metamask
      //no need for the Signer here, since we are only reading from the Blockchain
      const provider = await getProviderOrSigner();
      //we connect to the Contract using a Provider, so we will only
       //call the owner function from the tract
       const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
        );
        //call the owner function from the contract
        const _owner = await nftContract.owner();
        //we will get the signer now to extract the address of the current connected metamask account
        const signer = await getProviderOrSigner(true);
        //get the address associated to the signer which is connected metamask
        const address = await signer.getAddress();
        if(address.toLowerCase() === _owner.toLowerCase()){
          setIsOwner(true);
        }
    }
    catch(err){
      console.error(err.message);
    }
  };

  /**
   * getTokenIdsMinted: get the number of tokenIdes that have been minted
   */
  const getTokenIdsMinted = async() =>{
    try{
      //Get the Provider from web3Modal, which in our case is Metamask
      //No need for the signer here, as we are only reading state from the Blockchain
      const provider = await getProviderOrSigner();
      //We connect to the Contract using a Provider, so we will only
      //have Read-Only access from the Contract.
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      //call the tokenIds from the Contract
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString()); 
    }
    catch(err){
      console.error(err);
      
    }
  };

  /**
   * Returns a Provider or Signer object representing the ethereum RPC with or without
   * signing capabilities of metamask attached
   * 
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc
   *
   * A `Signer` is a special type Provider used in case of a `write` transaction needs to be made tot he Blockchain, which involves the connection of account
   * needing to make digital signature to autorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   * 
   * @params {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) =>{
    //connect to Metamsk
    // Since we store `web3Modal` as a reference, we need tho access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    
    //if user is not connected to the goerli network, let them know
    const { chainId } = await web3Provider.getNetwork();
    if(chainId !== 5){
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli")
    }

    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  //useEffects are used to react to changes in state of the website
  //the array at the end of function call represents what state changes will triger this effect
  //in this case, whenever the value of `wallectConnected` changes will be called
  useEffect(() =>{
    //if wallet is not connected, create a new instance of Web3Modal and connect the Metamask wallet
    if(!walletConnected){
      //Assign the Web3Modal class to the reference object by setting its `current` value
      //The `current` value is persisted throughout as long as the page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      //check if presale has started and ended
      const _presaleStarted = checkIfPresaleStarted();
     if(_presaleStarted){
      checkIfPresaleEnded();
     }
      getTokenIdsMinted();

      //Set an interval which gets called every 5 seconds to check if presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if(_presaleStarted){
          const _presaleEnded = await checkIfPresaleEnded();
          if(_presaleEnded){
            clearInterval(presaleEndedInterval)
          }
        }

      }, 5 * 1000);

      //set an interval to get the number of token Ids minted every 5 seconds to check if presale has ended
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  //
}, [walletConnected]);

  /**
   * renderButton: Returns a button based on the state of the dapp
   * 
   */
  const renderButton = () => {
    //if wallet is not connected, return a button which allows them to connect their wallet
    if(!walletConnected){
      return(
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
           </button>
      );

    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    //if connected user is the owner, and presale hasnt started, allow them to start the presale
    if(isOwner && !presaleStarted){
      return(
        <button className={styles.button} onClick={startPresale}>
          Start Presale
        </button>
      );
    }

      //If connected user is not the owner but presale hasnt started, tell them that
      if(!presaleStarted){
        return(
          <div>
          <div className={styles.description}>
            Presale hasnt Started
          </div>
          </div>
        )
      }

      //if presale started, but hasnt ended yet, allow for minting during the presale period
      if(presaleEnded && !presaleEnded){
        return(
          <div>
            <div className={styles.description}>
              Presale has started!!! if your address is Whitelisted, Mint a Crypto Dev 🥳 
            </div>
            <button className={styles.button} onClick={presaleMint}>
              Presale Mint 🚀
            </button>
          </div> 
        )
      }

      //If presale started and has ended, its time for public Minting
      if(presaleStarted && presaleEnded){
        return(
          <button className={styles.button} onClick={publicMint}>
            Public Mint 🚀
          </button>
        );
      }
    };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./19.svg" alt="Crypto Dev image" />
        </div>
      </div>
      

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
  }
