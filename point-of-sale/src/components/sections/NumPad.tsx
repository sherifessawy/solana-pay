import BigNumber from 'bignumber.js';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { usePayment } from '../../hooks/usePayment';
import { Digits } from '../../types';
import { BackspaceIcon } from '../images/BackspaceIcon';
import * as css from './NumPad.module.pcss';
import {useSearchParams} from 'react-router-dom';
import { Amount } from './Amount';

interface NumPadInputButton {
    input: Digits | '.';
    onInput(key: Digits | '.'): void;
}

const NumPadButton: FC<NumPadInputButton> = ({ input, onInput }) => {
    const onClick = useCallback(() => onInput(input), [onInput, input]);
    return (
        <button className={css.button} type="button" onClick={onClick}>
            {input}
        </button>
    );
};

export const NumPad: FC = () => {
    const { symbol, decimals } = useConfig();
    const regExp = useMemo(() => new RegExp('^\\d*([.,]\\d{0,' + decimals + '})?$'), [decimals]);

    const [searchParams] = useSearchParams(); //react-router-dom hook to grab url data
    const initialAmount = isNaN(Number(searchParams.get("amount"))) ? '0' : searchParams.get("amount") //checks that the type of the "amount" in the query string (url) is a number. It will set its value to zero incase of its type is NaN
    const [value, setValue] = useState(initialAmount || '0'); // initialize value to 'initialAmount'. If no amount in URL, it will be initialized to '0'

    useEffect(() => {
        //the URL might be encrypted in one of two ways 
        let decryptedURL = ''
        if(window.location.search && window.location.search.split("/charges/").length !== 2 && !searchParams.get('recipient')){
            // case #1, passed in query string with no parameters
            const encryptedURL = window.location.search.split('?')[1];
            decryptedURL = atob(encryptedURL) //decrypt the url
        } else if (window.location.search.split("/charges/").length === 2){
            // case #2, no query string and all encrypted url passed after ("/charges/")
            const encryptedURL = window.location.search.split("/charges/")[1];
            decryptedURL = atob(encryptedURL) //decrypt the url
        }
        
        const decryptedURLParams = new URLSearchParams(decryptedURL); //creating new URLsearchParams to allow searching the URL
        if(decryptedURLParams.get('amount')) setValue(decryptedURLParams.get('amount') || '0') //assigning value if exists

    }, [])

    
    const onInput = useCallback(
        (key) =>
            setValue((value) => {
                let newValue = (value + key).trim().replace(/^0{2,}/, '0');
                if (newValue) {
                    newValue = /^[.,]/.test(newValue) ? `0${newValue}` : newValue.replace(/^0+(\d)/, '$1');
                    if (regExp.test(newValue)) return newValue;
                }
                return value;
            }),
        [regExp]
    );
    const onBackspace = useCallback(() => setValue((value) => (value.length ? value.slice(0, -1) || '0' : value)), []);

    const { setAmount } = usePayment();
    useEffect(() => setAmount(value ? new BigNumber(value) : undefined), [setAmount, value]);

    return (
        <div className={css.root}>
            <div className={css.text}>Enter amount in {symbol}</div>
            <div className={css.value}>{value}</div>
            <div className={css.buttons}>
                <div className={css.row}>
                    <NumPadButton input={1} onInput={onInput} />
                    <NumPadButton input={2} onInput={onInput} />
                    <NumPadButton input={3} onInput={onInput} />
                </div>
                <div className={css.row}>
                    <NumPadButton input={4} onInput={onInput} />
                    <NumPadButton input={5} onInput={onInput} />
                    <NumPadButton input={6} onInput={onInput} />
                </div>
                <div className={css.row}>
                    <NumPadButton input={7} onInput={onInput} />
                    <NumPadButton input={8} onInput={onInput} />
                    <NumPadButton input={9} onInput={onInput} />
                </div>
                <div className={css.row}>
                    <NumPadButton input="." onInput={onInput} />
                    <NumPadButton input={0} onInput={onInput} />
                    <button className={css.button} type="button" onClick={onBackspace}>
                        <BackspaceIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};
