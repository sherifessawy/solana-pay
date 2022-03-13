import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus';
import { PublicKey } from '@solana/web3.js';
import React, { FC, useMemo } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { DEVNET_ENDPOINT } from '../../utils/constants';
import { ConfigProvider } from '../contexts/ConfigProvider';
import { FullscreenProvider } from '../contexts/FullscreenProvider';
import { PaymentProvider } from '../contexts/PaymentProvider';
import { ThemeProvider } from '../contexts/ThemeProvider';
import { TransactionsProvider } from '../contexts/TransactionsProvider';
import { SolanaPayLogo } from '../images/SolanaPayLogo';
import { SOLIcon } from '../images/SOLIcon';
import * as css from './RootRoute.module.pcss';

export const RootRoute: FC = () => {
    // If you're testing without a phone, set this to true to allow a browser-based wallet connection to be used
    const connectWallet = false;
    const wallets = useMemo(
        () => (connectWallet ? [new PhantomWalletAdapter(), new TorusWalletAdapter()] : []),
        [connectWallet]
    );

    const [params] = useSearchParams();
    const { recipient, label } = useMemo(() => {
        let recipient: PublicKey | undefined, label: string | undefined;

        let recipientParam = params.get('recipient');
        let labelParam = params.get('label');

        if (!recipientParam || !labelParam){
            //url is encrypted 
            let decryptedURL = ''
            //the URL might be encrypted in one of three ways   
            if (params.get('id')){
                // case #1, "id" present in the url
                const encryptedURL = params.get('id') || 'null' // get value of encrypted url
                decryptedURL = atob(encryptedURL) //decrypt the url
            } else if(window.location.search && !params.get('id') && window.location.search.split("/charges/").length !== 2 && !params.get('recipient')){
                // case #2, passed in query string with no parameters (i.e. no "id" in the url)
                const encryptedURL = window.location.search.split('?')[1];
                decryptedURL = atob(encryptedURL) //decrypt the url
            } else if (window.location.search.split("/charges/").length === 2){
                // case #3, no query string and all encrypted url passed after ("/charges/")
                const encryptedURL = window.location.search.split("/charges/")[1];
                decryptedURL = atob(encryptedURL) //decrypt the url
            } else {
                console.log('url passed incorrectly')
            }

            const decryptedURLparams = new URLSearchParams(decryptedURL); //creating new URLsearchParams to allow searching the URL

            recipientParam = decryptedURLparams.get('recipient') // grabbing value of recipient from the url
            labelParam = decryptedURLparams.get('label') // grabbing value of label from the url
            
            if (recipientParam && labelParam) {
                //assigning url values to recipient and label
                try {
                    recipient = new PublicKey(recipientParam);
                    label = labelParam;
                } catch (error) {
                    console.error(error);
                }
            }

        }

        if (recipientParam && labelParam) {
            //recipient and label are available in the url
            try {
                recipient = new PublicKey(recipientParam);
                label = labelParam;
            } catch (error) {
                console.error(error);
            }
        }

        return { recipient, label };
    }, [params]);

    return (
        <ThemeProvider>
            <FullscreenProvider>
                {recipient && label ? (
                    <ConnectionProvider endpoint={DEVNET_ENDPOINT}>
                        <WalletProvider wallets={wallets} autoConnect={connectWallet}>
                            <WalletModalProvider>
                                <ConfigProvider
                                    recipient={recipient}
                                    label={label}
                                    symbol="SOL"
                                    icon={<SOLIcon />}
                                    decimals={9}
                                    minDecimals={1}
                                    connectWallet={connectWallet}
                                >
                                    <TransactionsProvider>
                                        <PaymentProvider>
                                            <Outlet />
                                        </PaymentProvider>
                                    </TransactionsProvider>
                                </ConfigProvider>
                            </WalletModalProvider>
                        </WalletProvider>
                    </ConnectionProvider>
                ) : (
                    <div className={css.logo}>
                        <SolanaPayLogo width={240} height={88} />
                    </div>
                )}
            </FullscreenProvider>
        </ThemeProvider>
    );
};
