import {
    createTransaction,
    encodeURL,
    findTransactionSignature,
    FindTransactionSignatureError,
    parseURL,
    validateTransactionSignature,
    ValidateTransactionSignatureError,
} from '@solana/pay';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ConfirmedSignatureInfo, Keypair, PublicKey, TransactionSignature } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { PaymentContext, PaymentStatus } from '../../hooks/usePayment';
import { Confirmations } from '../../types';
import { useSearchParams } from 'react-router-dom';

export interface PaymentProviderProps {
    children: ReactNode;
}

export const PaymentProvider: FC<PaymentProviderProps> = ({ children }) => {
    const { connection } = useConnection();

    //recipient is availbe once url is loaded. 
    const { recipient, splToken, label, requiredConfirmations, connectWallet } = useConfig();
    const { publicKey, sendTransaction } = useWallet();

    const [amount, setAmount] = useState<BigNumber>();
    const [message, setMessage] = useState<string>();
    const [memo, setMemo] = useState<string>();
    const [reference, setReference] = useState<PublicKey>();
    const [signature, setSignature] = useState<TransactionSignature>();
    const [status, setStatus] = useState(PaymentStatus.New);
    const [confirmations, setConfirmations] = useState<Confirmations>(0);
    const navigate = useNavigateWithQuery();
    const progress = useMemo(() => confirmations / requiredConfirmations, [confirmations, requiredConfirmations]);

    const [searchParams] = useSearchParams(); //react-route-dom hook to grab URL values
    const [recipient1, setRecipient1] =  useState(searchParams.get('recipient1') || undefined) //grapping recipient1 value from the url. if recipient1 is not present in the url loaded variable will be set to undefined.
    const [percent, setPercent] =  useState(searchParams.get('percent') || undefined) //grapping recipient1 value from the url.
    const [percent1, setPercent1] =  useState(searchParams.get('percent1') || undefined) //grapping recipient1 value from the url.
    const [secret, setSecret] =  useState(searchParams.get('secret') || undefined) //grapping recipient1 value from the url.
    const [referenceNew, setReferenceNew] =  useState(searchParams.get('reference') || undefined) //grapping recipient1 value from the url.
    const [spltokenNew, setSpltokenNew] =  useState(searchParams.get('spl-token') || undefined) //grapping recipient1 value from the url.

    useEffect(() => {
        if((window.location.search && !searchParams.get('recipient')) || window.location.href.split("/charges/)").length > 1 ){
            let decryptedURL = ''
            //the URL might be encrypted in one of two ways   
            if(window.location.search && window.location.search.split("/charges/").length !== 2){
                // case #1, passed in query string with no parameters 
                const encryptedURL = window.location.search.split('?')[1];
                decryptedURL = atob(encryptedURL) //decrypt the url
            } else if (window.location.search.split("/charges/").length === 2 ){
                // case #2, encrypted url is passed after "/charges/"
                const encryptedURL = window.location.search.split("/charges/")[1];
                decryptedURL = atob(encryptedURL) //decrypt the url
            } else{
                console.log("url passed is not as expected")
            }
            
            const decryptedURLparams = new URLSearchParams(decryptedURL); //creating new URLsearchParams to allow searching the URL
            
            if(decryptedURLparams.get('amount')) setAmount(new BigNumber(Number(decryptedURLparams.get('amount')))) //assigning value if exists
            setMessage(decryptedURLparams.get('message') || undefined) //assigning value if exists
            setMemo(decryptedURLparams.get('memo') || undefined) //assigning value if exists
            setRecipient1(decryptedURLparams.get('recipient1') || undefined) //assigning value if exists
            setPercent(decryptedURLparams.get('percent') || undefined) //assigning value if exists
            setPercent1(decryptedURLparams.get('percent1') || undefined) //assigning value if exists
            setSecret(decryptedURLparams.get('secret') || undefined) //assigning value if exists
            setReferenceNew(decryptedURLparams.get('reference') || undefined) //assigning value if exists
            setSpltokenNew(decryptedURLparams.get('spl-token') || undefined) //assigning value if exists
        } else{ //url is not encrypted
            if(searchParams.get('amount')) setAmount(new BigNumber(Number(searchParams.get('amount')))) //assigning value if exists
            setMessage(searchParams.get('message') || undefined) //assigning value if exists
            setMemo(searchParams.get('memo') || undefined) //assigning value if exists
        }
    }, [])

    const url = useMemo(
        () =>
            encodeURL({
                recipient,
                amount,
                splToken,
                reference,
                label,
                message,
                memo,
            }),
        [recipient, amount, splToken, reference, label, message, memo]
    );

    const reset = useCallback(() => {
        setAmount(undefined);
        setMessage(undefined);
        setMemo(undefined);
        setReference(undefined);
        setSignature(undefined);
        setStatus(PaymentStatus.New);
        setConfirmations(0);
        navigate('/new', { replace: true });
    }, [navigate]);

    const generate = useCallback(() => {
        if (status === PaymentStatus.New && !reference) {
            setReference(Keypair.generate().publicKey);
            setStatus(PaymentStatus.Pending);
            navigate('/pending');
        }
    }, [status, reference, navigate]);

    // If there's a connected wallet, use it to sign and send the transaction
    useEffect(() => {
        if (status === PaymentStatus.Pending && connectWallet && publicKey) {
            let changed = false;

            const run = async () => {
                try {
                    const { recipient, amount, splToken, reference, memo } = parseURL(url);
                    if (!amount) return;

                    const transaction = await createTransaction(connection, publicKey, recipient, amount, {
                        splToken,
                        reference,
                        memo,
                    });

                    if (!changed) {
                        await sendTransaction(transaction, connection);
                    }
                } catch (error) {
                    // If the transaction is declined or fails, try again
                    console.error(error);
                    timeout = setTimeout(run, 5000);
                }
            };
            let timeout = setTimeout(run, 0);

            return () => {
                changed = true;
                clearTimeout(timeout);
            };
        }
    }, [status, connectWallet, publicKey, url, connection, sendTransaction]);

    // When the status is pending, poll for the transaction using the reference key
    useEffect(() => {
        if (!(status === PaymentStatus.Pending && reference && !signature)) return;
        let changed = false;

        const interval = setInterval(async () => {
            let signature: ConfirmedSignatureInfo;
            try {
                signature = await findTransactionSignature(connection, reference, undefined, 'confirmed');

                if (!changed) {
                    clearInterval(interval);
                    setSignature(signature.signature);
                    setStatus(PaymentStatus.Confirmed);
                    navigate('/confirmed', { replace: true });
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                // If the RPC node doesn't have the transaction signature yet, try again
                if (!(error instanceof FindTransactionSignatureError)) {
                    console.error(error);
                }
            }
        }, 250);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [status, reference, signature, connection, navigate]);

    // When the status is confirmed, validate the transaction against the provided params
    useEffect(() => {
        if (!(status === PaymentStatus.Confirmed && signature && amount)) return;
        let changed = false;

        const run = async () => {
            try {
                await validateTransactionSignature(
                    connection,
                    signature,
                    recipient,
                    amount,
                    splToken,
                    reference,
                    'confirmed'
                );

                if (!changed) {
                    setStatus(PaymentStatus.Valid);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                // If the RPC node doesn't have the transaction yet, try again
                if (
                    error instanceof ValidateTransactionSignatureError &&
                    (error.message === 'not found' || error.message === 'missing meta')
                ) {
                    console.warn(error);
                    timeout = setTimeout(run, 250);
                    return;
                }

                console.error(error);
                setStatus(PaymentStatus.Invalid);
            }
        };
        let timeout = setTimeout(run, 0);

        return () => {
            changed = true;
            clearTimeout(timeout);
        };
    }, [status, signature, amount, connection, recipient, splToken, reference]);

    // When the status is valid, poll for confirmations until the transaction is finalized
    useEffect(() => {
        if (!(status === PaymentStatus.Valid && signature)) return;
        let changed = false;

        const interval = setInterval(async () => {
            try {
                const response = await connection.getSignatureStatus(signature);
                const status = response.value;
                if (!status) return;
                if (status.err) throw status.err;

                if (!changed) {
                    const confirmations = (status.confirmations || 0) as Confirmations;
                    setConfirmations(confirmations);

                    if (confirmations >= requiredConfirmations || status.confirmationStatus === 'finalized') {
                        clearInterval(interval);
                        setStatus(PaymentStatus.Finalized);
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.log(error);
            }
        }, 250);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [status, signature, connection, requiredConfirmations]);

    return (
        <PaymentContext.Provider
            value={{
                amount,
                setAmount,
                message,
                setMessage,
                memo,
                setMemo,
                reference,
                signature,
                status,
                confirmations,
                progress,
                url,
                reset,
                generate,
            }}
        >
            {children}
        </PaymentContext.Provider>
    );
};
