import React, { FC, useRef, useLayoutEffect } from 'react';
import { usePayment } from '../../hooks/usePayment';
import * as css from './GenerateButton.module.pcss';

export const GenerateButton: FC = () => {
    const { amount, generate, GPCbtnSelfTrigger } = usePayment();

    const btnRef = useRef<HTMLButtonElement>(null); //create reference to the button

    useLayoutEffect(() => {
        if (amount && GPCbtnSelfTrigger) {
            btnRef.current?.click(); //trigerring a self click if amount is not equal to zero
        }
    }, [btnRef, amount]);

    return (
        <button
            className={css.root}
            type="button"
            onClick={generate}
            disabled={!amount || amount.isLessThanOrEqualTo(0)}
            ref={btnRef} //button reference
        >
            Generate Payment Code
        </button>
    );
};
