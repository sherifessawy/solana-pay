import React, { FC, useEffect, useContext } from 'react';
import { useMediaQuery } from 'react-responsive';
import { FullscreenButton } from '../buttons/FullscreenButton';
import { GenerateButton } from '../buttons/GenerateButton';
import { TransactionsLink } from '../buttons/TransactionsLink';
import { NumPad } from '../sections/NumPad';
import { PoweredBy } from '../sections/PoweredBy';
import { Summary } from '../sections/Summary';
import * as css from './NewRoute.module.pcss';
import { usePayment } from '../../hooks/usePayment';

export const NewRoute: FC = () => {
    const phone = useMediaQuery({ query: '(max-width: 767px)' });

    const { redirect, postData } = usePayment();

    return phone ? (
        <div className={css.root}>
            <div className={css.top}>
                <FullscreenButton />
                <TransactionsLink />
            </div>
            <div className={css.body}>
                <NumPad />
                <GenerateButton />
            </div>
            <PoweredBy />
        </div>
    ) : (
        <div className={css.root}>
            <div className={css.main}>
                <div className={css.top}>
                    <FullscreenButton />
                </div>
                <div className={css.body}>
                    <NumPad />
                </div>
                <PoweredBy />
            </div>
            <div className={css.side}>
                <div className={css.summary}>
                    <Summary />
                    <GenerateButton />
                </div>
                <div className={css.bottom}>
                    <TransactionsLink />
                </div>
                {redirect && postData()} {/* if redirect is true, it will call postData() */}
            </div>
        </div>
    );
};
