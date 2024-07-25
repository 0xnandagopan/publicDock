import { useState, useCallback, useEffect } from "react";
import {
  useMetaMaskStore,
  useSignStore,
  useGarden,
} from "./Store.tsx";
import { formatUnits } from "ethers";
import { Contract } from "ethers";
import { ERC20ABI } from "./erc20.ts";

const Balances: React.FC = () => {
  const { bitcoin } = useGarden();
  const { evmProvider } = useMetaMaskStore();
  const { isMMPopUpOpen, isSigned, setIsMMPopUpOpen, setIsSigned } =
    useSignStore();
  const [btcBalance, setBtcBalance] = useState("0");
  const [wbtcBalance, setWbtcBalance] = useState("0");

  const fetchBalance = useCallback(async () => {
    if (!bitcoin || !evmProvider) return;
    if (isMMPopUpOpen && !isSigned) return;

    let balance = 0;

    try {
      if (!isSigned) setIsMMPopUpOpen(true);
      balance = await bitcoin.getBalance();
      setIsSigned(true);
      setIsMMPopUpOpen(false);
      setBtcBalance(Number(formatUnits(balance, 8)).toFixed(6));

      const erc20 = new Contract(
        "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        ERC20ABI,
        evmProvider
      );

      const signer = evmProvider.getSigner();
      const walletAddress = (await signer).getAddress();
      const wbtc = await erc20.balanceOf(walletAddress);
      setWbtcBalance(Number(formatUnits(wbtc, 8)).toFixed(6));
    } catch (err) {
      setIsSigned(false);
      setIsMMPopUpOpen(false);
    }
  }, [bitcoin, evmProvider, isMMPopUpOpen]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchBalance();
    }, 10000);

    return () => {
      clearInterval(id);
    };
  }, [fetchBalance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return (
    <div className="balances">
      <p>Bitcoin: {btcBalance}</p>
      <p>WBTC: {wbtcBalance}</p>
    </div>
  );
};

export default Balances;
