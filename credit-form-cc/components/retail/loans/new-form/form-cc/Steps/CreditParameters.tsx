import { ICities, IOffices } from '@components/Form/CustomFields/CompanyBranches/interfaces';
import { FormButton } from '@components/Form/FormButton/FormButton';
import { FormCheckbox } from '@components/Form/FormCheckbox/FormCheckbox';
import Yup from '@components/Form/helpers/validations';
import { CompanyBranches, CompanyRegion } from '@components/Form/widgets';
import { AmountField } from '@components/Form/widgets/AmountField/AmountField';
import { OfficeMap } from '@components/Form/widgets/OfficeMap';
import { FormWrapper } from '@components/retail/common/form-elements/FormWrapper';
import { CREDITS_LOCALSTORAGE } from '@constants/localStorage';
import { CASH_CREDIT_RATES } from '@features/Calculator/components/CreditCalculator/CreditCalculator';
import { CalculatorAmountField } from '@features/Calculator/components/Fields/CalculatorAmountField';
import { CalculatorDateFieldMonths } from '@features/Calculator/components/Fields/CalculatorDateFieldMonths';
import { useCreditCalculatorState } from '@features/Calculator/hooks';
import { yupResolver } from '@hookform/resolvers/dist/ie11/yup';
import { IRange } from '@interfaces';
import { sendShortOrderlog } from '@services/form';
import { Button, Typography } from '@ui';
import { ButtonGroup } from '@ui/ButtonGroup';
import { Space } from '@ui/Space';
import { TextField } from '@ui/TextField';
import { storageService } from '@utils/storageService';
import { useFormFocus } from 'hooks/useFormFocus';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form/dist/index.ie11';
import styled, { use } from 'reshadow';
import { getFormTouched } from 'utils/formTouched';

import { CreditFormData, FormControl } from '../types';
import baseStyles from './Steps.module.scss';

const validationSchema = Yup.object().shape({
    officeRegion: Yup.string().required(),
    officeCity: Yup.string().required(),
    officeBranch: Yup.string().required(),
    filialCode: Yup.string(),
    creditAmount: Yup.string().required(),
    creditPeriod: Yup.string().required(),
    insurance: Yup.bool(),
    creditTotalAmount: Yup.string().required(),
    monthlyPayment: Yup.string().required(),
    creditPurpose: Yup.string().required(),
});

const touched = getFormTouched('cash-credit-form');
const creditStorageService = storageService(CREDITS_LOCALSTORAGE);
export const CREDIT_PRODUCT = 'creditParams';

export const CreditParameters: React.FC<FormControl & { sumRange: IRange }> = ({
    applicationAnalyzer: { sessionEvents },
    data,
    setData,
    setMachineState,
    sumRange,
}) => {
    touched.setDefaultTouched(data);

    const {
        control,
        handleSubmit,
        errors,

        formState: { isSubmitting, isValid },
        watch,
        getValues,
        trigger,
        setValue,
    } = useForm({
        defaultValues: {
            ...data,
            ...creditStorageService.get(CREDIT_PRODUCT),
        },
        shouldUnregister: false,
        shouldFocusError: true,
        resolver: yupResolver(validationSchema),
        mode: 'onTouched',
    });

    const onSubmit = async (formData: CreditFormData) => {
        const updatedData = {
            ...data,
            ...formData,
        };
        setData(updatedData);
        setMachineState({ type: 'PASSPORT_INFO' });

        sendShortOrderlog(formData, 'Нажата кнопка Далее');

        sessionEvents.formStepComplete();
    };

    const officeCity = watch('officeCity');
    const creditAmount = watch('creditAmount');
    const creditPeriod = watch('creditPeriod');
    const insurance = watch('insurance');

    const handleCitySelect = (option: ICities) => {
        setValue('officeCity', option.name);
        setValue('officeBranch', '');
    };

    const handleOnMapSelect = (office: IOffices) => {
        setValue('officeRegion', office.locality.city.region.code_interlayer);
        setValue('selectedOffice', office);
        setValue('officeCity', office.locality.city.name);
        setValue('officeBranch', office.locality.short_address);
        setValue('filialCode', office.code_crif);
        trigger('officeBranch');
    };

    const handleBranchSelect = (option: IOffices) => {
        setValue('officeRegion', option.locality.city.region.code_interlayer);
        setValue('officeBranch', option.locality?.short_address);
        setValue('filialCode', option.code_crif);
    };

    const handleReturn = () => {
        const filledValues = getValues();
        setData({
            ...data,
            ...filledValues,
        });

        setMachineState({ type: 'BACK' });
    };

    const rate = insurance
        ? creditAmount > 300000
            ? CASH_CREDIT_RATES.withInsuranceBig
            : CASH_CREDIT_RATES.withInsurance
        : creditAmount > 300000
        ? CASH_CREDIT_RATES.withoutInsuranceBig
        : CASH_CREDIT_RATES.withoutInsurance;

    const {
        values: { monthPay, sum },
    } = useCreditCalculatorState({
        sum: Number(creditAmount),
        month: Number(creditPeriod),
        rate,
        insurance,
    });

    useEffect(() => {
        setValue('monthlyPayment', monthPay);
        setValue('creditTotalAmount', sum.toFixed());
    }, [monthPay, sum]);

    const formRef = useFormFocus();

    useEffect(() => {
        if (control && control.fieldsRef.current.creditAmount?.ref?.focus) {
            control.fieldsRef.current.creditAmount?.ref?.focus();
        }
    }, []);

    const selectedCity = watch('officeCity');

    return styled(baseStyles)(
        <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            ref={formRef}
            data-form-step="2"
            method="post"
        >
            <FormWrapper>
                <Controller
                    {...{ as: CalculatorAmountField }}
                    id="cash-credit-amount"
                    name="creditAmount"
                    marks={{
                        [sumRange.min]: `${sumRange.min / 1000} тыс`,
                        [sumRange.max]: `${sumRange.max / 1000000} млн`,
                    }}
                    onChangeField={(value: number) => setValue('creditAmount', value.toString())}
                    control={control}
                    label="Сумма кредита"
                    stepInput={5000}
                    maxLength={8}
                    range={sumRange}
                />

                <Controller
                    {...{ as: CalculatorDateFieldMonths }}
                    id="cash-credit-duration"
                    name="creditPeriod"
                    range={{ min: 13, max: 84 }}
                    onChangeField={(value: number) => setValue('creditPeriod', value.toString())}
                    value={14}
                    label="Срок кредита"
                    marks={{
                        13: '13 месяцев',
                        24: '',
                        36: '',
                        48: '4 года',
                        60: '',
                        72: '',
                        84: '7 лет',
                    }}
                    control={control}
                />
                <Space>
                    <FormCheckbox
                        name="insurance"
                        hidden
                        control={control}
                        id="cash-credit-insurance"
                        label="Cтрахование жизни"
                    />
                </Space>

                <Controller
                    {...{ as: AmountField }}
                    type="hidden"
                    name="creditTotalAmount"
                    id="cash-credit-total-sum"
                    control={control}
                    label="Общая сумма кредита"
                />

                <Controller
                    {...{ as: AmountField }}
                    name="monthlyPayment"
                    id="cash-credit-monthly-payment"
                    control={control}
                    label="Ежемесячный платеж от"
                />

                <Controller
                    {...{ as: TextField }}
                    name="creditPurpose"
                    type="hidden"
                    id="cash-credit-purpose"
                    control={control}
                    label="Цель кредита"
                />

                <Space>
                    <Typography variant="p" {...use({ helperText: true })}>
                        Выберите город и офис, в котором вам будет удобно получить денежные средства
                    </Typography>
                </Space>
                <Controller
                    {...{ as: CompanyRegion }}
                    name="officeCity"
                    id="cash-credit-city"
                    label="Выберите город"
                    onOptionSelect={handleCitySelect}
                    control={control}
                    error={!!errors.officeCity?.message}
                    helperText={errors.officeCity?.message}
                />
            </FormWrapper>

            <OfficeMap
                city={selectedCity}
                officeType="individual"
                onOfficeSelect={handleOnMapSelect}
                value={watch('officeBranch')}
                branchField={
                    <FormWrapper>
                        <Controller
                            {...{ as: CompanyBranches }}
                            officeType="individual"
                            name="officeBranch"
                            id="cash-credit-branch"
                            label="Выберите отделение"
                            disabled={!officeCity}
                            filterCity={officeCity}
                            onOptionSelect={handleBranchSelect}
                            control={control}
                            error={!!errors.officeBranch?.message}
                            helperText={errors.officeBranch?.message}
                        />
                    </FormWrapper>
                }
            />
            <FormWrapper>
                <ButtonGroup justifyContent="center">
                    <Button type="button" variant="secondary" onClick={handleReturn} noBorder>
                        Предыдущий шаг
                    </Button>
                    <FormButton loading={isSubmitting} valid={isValid}>
                        Следующий шаг
                    </FormButton>
                </ButtonGroup>
            </FormWrapper>
        </form>
    );
};
