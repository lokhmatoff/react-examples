import { CashCreditFormCC } from '@components/retail/loans/new-form/personal-loan/CashCreditFormCC';
import { Section } from '@components/Section';
import { CommonLayout } from '@features/Layout';
import { baseStyles } from '@ui';
import React from 'react';
import styled from 'reshadow';

const Page: React.FC = () => {
    return styled(baseStyles)(
        <CommonLayout>
            <Section id="personal-loan-form-container">
                <CashCreditFormCC />
            </Section>
        </CommonLayout>
    );
};

export default () => <Page />;
