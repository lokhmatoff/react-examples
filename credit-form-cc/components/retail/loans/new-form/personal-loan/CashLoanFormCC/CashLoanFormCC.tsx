import { FormSuccess } from '@components/Form/FormSuccess';
import { FormSection } from '@components/retail/common/form-elements/FormSection/FormSection';
import { FORM_ALIAS } from '@constants/forms';
import { applicationAnalyzer } from '@services/application-analyzer';
import { sendShortOrderlog } from '@services/form';
import { ShortLogRequestData } from '@services/form/types';
import { createSession } from '@services/formCore';
import { Typography } from '@ui';
import { Container } from '@ui/Container';
import { ProgressBarGroup, ProgressBarItemProps } from '@ui/ProgressBar';
import { useMachine } from '@xstate/react';
import { ThemeProvider } from 'contexts/ThemeContext';
import React, { HTMLAttributes, useEffect, useState } from 'react';
import styled, { css } from 'reshadow';

import { creditFormMachine } from '../../form-cc/creditFormMachine';
import { CreditParameters } from '../../form-cc/Steps/CreditParameters';
import { IncomeInfo } from '../../form-cc/Steps/IncomeInfo';
import { PassportInfo } from '../../form-cc/Steps/PassportInfo';
import { PersonalInfo } from '../../form-cc/Steps/PersonalInfo';
import { cashCreditDefaultValues } from './utils';

const styles = css`
    Typography {
        text-align: center;
    }
`;

export const CashCreditFormCC: React.FC<HTMLAttributes<HTMLDivElement>> = (props) => {
    const [machineState, setMachineState] = useMachine(creditFormMachine);
    const [data, setData] = useState(cashCreditDefaultValues);

    const personalInfo = machineState.matches('personalInfo');
    const creditParameters = machineState.matches('creditParameters');
    const passportInfo = machineState.matches('passportInfo');
    const incomeInfo = machineState.matches('incomeInfo');
    const success = machineState.matches('success');

    const handleStepChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMachineState({ type: event.target.value });
    };

    const steps: ProgressBarItemProps[] = [
        {
            step: '1',
            value: 'personalInfo',
            active: personalInfo,
            completed: creditParameters || passportInfo || incomeInfo,
            label: 'Личные данные',
        },
        {
            step: '2',
            value: 'creditParameters',
            completed: passportInfo || incomeInfo,
            label: 'Параметры кредита',
        },
        {
            step: '3',
            value: 'passportInfo',
            completed: incomeInfo,
            label: 'Паспортные данные',
        },
        {
            step: '4',
            value: 'incomeInfo',
            completed: false,
            label: 'Информация о доходе',
        },
    ];

    useEffect(() => {
        const shortOrderData: ShortLogRequestData = {
            fullName: '',
            birthDate: '',
            phone: '',
            email: '',
        };

        sendShortOrderlog(shortOrderData, 'Вход на страницу');

        createSession(FORM_ALIAS.PersonalLoan, 'call-center');
    }, []);

    return styled(styles)(
        <FormSection bgColor="grey-50" paddingBottom={!success} {...props}>
            {success ? (
                <FormSuccess />
            ) : (
                <ThemeProvider theme="white">
                    <Container>
                        <Typography variant="h2">Заявка на получение кредита (для КЦ)</Typography>
                    </Container>

                    <ProgressBarGroup
                        name="step"
                        items={steps}
                        onChange={handleStepChange}
                        value={machineState.value as string}
                    />
                    <Container>
                        {personalInfo && (
                            <PersonalInfo
                                applicationAnalyzer={applicationAnalyzer.step(1)}
                                data={data}
                                setData={setData}
                                machineState={machineState}
                                setMachineState={setMachineState}
                            />
                        )}
                        {creditParameters && (
                            <CreditParameters
                                applicationAnalyzer={applicationAnalyzer.step(2)}
                                data={data}
                                setData={setData}
                                machineState={machineState}
                                setMachineState={setMachineState}
                                sumRange={{ min: 100000, max: 3000000 }}
                            />
                        )}
                        {passportInfo && (
                            <PassportInfo
                                applicationAnalyzer={applicationAnalyzer.step(3)}
                                data={data}
                                setData={setData}
                                machineState={machineState}
                                setMachineState={setMachineState}
                            />
                        )}
                        {incomeInfo && (
                            <IncomeInfo
                                applicationAnalyzer={applicationAnalyzer.step(4)}
                                data={data}
                                setData={setData}
                                machineState={machineState}
                                setMachineState={setMachineState}
                            />
                        )}
                    </Container>
                </ThemeProvider>
            )}
        </FormSection>
    );
};
