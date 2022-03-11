import BigNumber from 'bignumber.js';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { usePayment } from '../../hooks/usePayment';
import { Digits } from '../../types';
import { BackspaceIcon } from '../images/BackspaceIcon';
import * as css from './NumPad.module.pcss';
import {useSearchParams} from 'react-router-dom';

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

    const [searchParams, setSearchParams] = useSearchParams(); //react-router-dom hook to grab url data

    const initialAmount = isNaN(Number(searchParams.get("amount"))) ? '0' : searchParams.get("amount") //checks that the type of the "amount" in the query string (url) is a number. It will set its value to zero incase of its type is NaN
    
    const [value, setValue] = useState(initialAmount || '0'); // initialize value to 'initialAmount'. If no amount in URL, it will be initialized to '0'
    
    useEffect(() => {
        //if the URL encrypted, it will have 'id' param in it.
        if(searchParams.get('id')){
            const encryptedURL: string = searchParams.get('id') || 'null'
            const decryptedURL = atob(encryptedURL) //decrypt the url
            const params = new URLSearchParams(decryptedURL); //creating new URLsearchParams to allow searching the URL
            if(params.get('amount')) setValue(params.get('amount') || '0') //assigning value if exists
        }
    }, [searchParams.get('id')])

    
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
