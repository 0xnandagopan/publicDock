import { useEffect } from "react";
import { BrowserProvider } from "ethers";
import { create } from "zustand";
import { GardenJS } from "@gardenfi/core";
import { Orderbook, Chains } from "@gardenfi/orderbook";
import {
  BitcoinOTA,
  BitcoinProvider,
  BitcoinNetwork,
  EVMWallet,
} from "@catalogfi/wallets";

type EvmWalletState = {
  isMetamaskConnected: boolean;
  evmProvider: BrowserProvider | null;
};

type EvmWalletActions = {
  ConnectMetaMask: () => Promise<void>;
};

const networkConfig = {
  chainId: "0x7A69",
  chainName: "ethereum-localnet",
  rpcUrls: ["http://localhost:8545"],
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

const useMetaMaskStore = create<EvmWalletState & EvmWalletActions>((set) => ({
  isMetamaskConnected: false,
  evmProvider: null,
  ConnectMetaMask: async () => {
    if (window.ethereum !== null) {
      let provider = new BrowserProvider(window.ethereum);
      let network = await provider.getNetwork();

      if (network.chainId !== 31337n) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [networkConfig],
        });

        provider = new BrowserProvider(window.ethereum);

        set(() => ({
          isMetamaskConnected: true,
          evmProvider: provider,
        }));
      }
    } else {
      throw new Error("MetaMask not found !");
    }
  },
}));

type SignStore = {
  isMMPopUpOpen: boolean;
  isSigned: boolean;
  setIsMMPopUpOpen: (isMMPopUpOpen: boolean) => void;
  setIsSigned: (isSigned: boolean) => void;
};

const useSignStore = create<SignStore>((set) => ({
  isMMPopUpOpen: false,
  isSigned: false,
  setIsMMPopUpOpen: (isMMPopUpOpen: boolean) => {
    set(() => ({ isMMPopUpOpen }));
  },
  setIsSigned: (isSigned: boolean) => {
    set(() => ({ isSigned }));
  },
}));

type GardenStore = {
  garden: GardenJS | null;
  bitcoin: BitcoinOTA | null;
  setGarden: (garden: GardenJS, bitcoin: BitcoinOTA) => void;
};

const gardenStore = create<GardenStore>((set) => ({
  garden: null,
  bitcoin: null,
  setGarden: (garden: GardenJS, bitcoin: BitcoinOTA) => {
    set(() => ({
      garden,
      bitcoin,
    }));
  },
}));

const useGarden = () => ({
  garden: gardenStore((state) => state.garden),
  bitcoin: gardenStore((state) => state.bitcoin),
});

const useGardenSetup = () => {
  const { evmProvider } = useMetaMaskStore();
  const { setGarden } = gardenStore();

  useEffect(() => {
    (async () => {
      if (!evmProvider) return;
      const signer = await evmProvider.getSigner();

      const bitcoinProvider = new BitcoinProvider(
        BitcoinNetwork.Regtest,
        "http://localhost:3000"
      );

      const orderbook = await Orderbook.init({
        url: "http://localhost:8080",
        signer: signer,
        opts: {
          domain: (window as any).location.host,
          store: localStorage,
        },
      });

      const wallets = {
        [Chains.bitcoin_regtest]: new BitcoinOTA(bitcoinProvider, signer),
        [Chains.ethereum_localnet]: new EVMWallet(signer),
      };

      const garden = new GardenJS(orderbook, wallets);

      setGarden(garden, wallets[Chains.bitcoin_regtest]);
    })();
  }, [evmProvider, setGarden]);
};

export { useMetaMaskStore, useSignStore, useGarden, useGardenSetup };
