import { Agreement } from '@components/Form/Agreement';
import { FormButton } from '@components/Form/FormButton/FormButton';
import { FormCheckbox } from '@components/Form/FormCheckbox/FormCheckbox';
import { checkValidation } from '@components/Form/helpers';
import Yup, { fio } from '@components/Form/helpers/validations';
import { DadataFIO, DatePicker, EmailField, PhoneWidget } from '@components/Form/widgets';
import { splitFullName } from '@components/Form/widgets/helpers';
import { FormWrapper } from '@components/retail/common/form-elements/FormWrapper';
import { PhoneFieldTooltip } from '@components/retail/common/form-elements/PhoneFieldTooltip';
import { removeMask } from '@components/RKOForm/OpenAccountForm/helpers';
import { yupResolver } from '@hookform/resolvers/dist/ie11/yup';
import { sendShortOrderlog } from '@services/form';
import { RadioButtonGroup } from '@ui';
import { Col, Row } from '@ui/Grid';
import { Space } from '@ui/Space';
import { addMonths, subDays, subYears } from 'date-fns';
import React from 'react';
import { DaDataFioSuggestion } from 'react-dadata';
import { Controller, useForm } from 'react-hook-form/dist/index.ie11';
import styled from 'reshadow';
import { getFormTouched } from 'utils/formTouched';

import { CreditFormData, FormControl } from '../types';
import baseStyles from './Steps.module.scss';

const AGE_LIMIT = {
    MAX: 75,
    MIN: 21,
};

const BIRTHDATE_CALENDAR_SETTINGS = {
    //AGE SETTINGS
    // 21<age<75
    disabledDays: { after: subDays(subYears(new Date(), AGE_LIMIT.MIN), 1) },
    fromMonth: subYears(new Date(), AGE_LIMIT.MAX),
    initialMonth: subYears(new Date(), AGE_LIMIT.MIN),
    toMonth: subYears(new Date(), AGE_LIMIT.MIN),
};

const validationSchema = Yup.object().shape({
    fullName: fio,
    phone: Yup.string().required().phoneNumber(),
    email: Yup.string().required().trim().email(),
    birthDate: Yup.string()
        .required('Введите дату')
        .isDate()
        .maxDate(
            subDays(subYears(new Date(), AGE_LIMIT.MIN), 1),
            `Минимальный возраст для рассмотрения заявки ${AGE_LIMIT.MIN} лет. Если вам ещё не исполнилось ${AGE_LIMIT.MIN} лет, для оформления карты необходимо обратиться в офис Банка.`
        )
        .minDate(
            addMonths(subYears(new Date(), AGE_LIMIT.MAX), 13),
            `Максимальный возраст на момент окончания действия кредита должен быть не более ${AGE_LIMIT.MAX} лет`
        ),
    confirmation: Yup.bool(),
    gender: Yup.string().oneOf(['M', 'F']),
    agreement: Yup.bool().oneOf([true], 'Для продолжения нужно согласие с условиями'),
});

const touched = getFormTouched('cash-credit-form');

export const PersonalInfo: React.FC<FormControl> = ({
    applicationAnalyzer: { updateSession, sessionEvents },
    data,
    setData,
    setMachineState,
    machineState,
}) => {
    touched.setDefaultTouched(data);

    const {
        control,
        handleSubmit,
        errors,
        formState,
        formState: { isSubmitting, isValid },
        setValue,
        getValues,
    } = useForm({
        defaultValues: {
            ...data,
            fioFieldOpen: false,
        },
        shouldUnregister: false,
        resolver: yupResolver(validationSchema),
        mode: 'onTouched',
    });

    const onSubmit = async (formData: CreditFormData) => {
        setData({ ...data, ...formData });

        //Next Step When Phone Already Confirmed
        setMachineState({ type: 'CREDIT_PARAMETERS' });
        sendShortOrderlog(formData, 'Заполнен первый шаг');

        const { fullName, phone, email } = formData;
        const { name, surname, patronymic } = splitFullName(fullName);
        updateSession({
            name,
            surname,
            patronymic,
            phone: removeMask(phone),
            email,
        });

        sessionEvents.formStepComplete();
    };

    const formInfo = {
        touched: touched.getTouched(),
        formState,
    };

    const handleStartInteraction = () => {
        if (!machineState.context.formInteractionStarted) {
            sessionEvents.formStartInteraction();

            window.dataLayer.push({
                event: 'form_track',
                eventAction: 'formBeginFilled',
                eventCategory: 'site_form',
                eventLabel: window.location.pathname,
            });
            setMachineState({ type: 'START' });
        }
    };

    const handleNameSelect = (option: DaDataFioSuggestion) => {
        setValue('fullName', option.value, { shouldValidate: true });

        if (option.data.gender === 'MALE' || option.data.gender === 'FEMALE') {
            setValue('gender', option.data.gender[0]);
        }
    };

    return styled(baseStyles)(
        <FormWrapper>
            <form
                onFocus={handleStartInteraction}
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                data-form-step="1"
                method="post"
            >
                <Controller
                    {...{ as: DadataFIO }}
                    name="fullName"
                    id="card-enerjeans-name"
                    label="Фамилия Имя Отчество"
                    onOptionSelect={handleNameSelect}
                    control={control}
                    error={!!errors.fullName?.message}
                    helperText={
                        errors.fullName?.message || 'Введите данные в соответствии с паспортом'
                    }
                    trailing={checkValidation(formInfo, 'fullName')}
                />
                <Row>
                    <Col col={{ md: 6 }}>
                        <Controller
                            {...{ as: PhoneWidget }}
                            name="phone"
                            label="Номер телефона"
                            id="cash-credit-phone"
                            control={control}
                            trailing={
                                <>
                                    {checkValidation(formInfo, 'phone')}
                                    <PhoneFieldTooltip />
                                </>
                            }
                            error={!!errors.phone?.message}
                            helperText={errors.phone?.message}
                        />
                    </Col>
                    <Col col={{ md: 6 }}>
                        <Controller
                            {...{ as: EmailField }}
                            name="email"
                            id="cash-credit-email"
                            label="Email"
                            control={control}
                            error={!!errors.email?.message}
                            helperText={errors.email?.message}
                            trailing={checkValidation(formInfo, 'email')}
                        />
                    </Col>
                </Row>
                <Controller
                    {...{ as: DatePicker }}
                    name="birthDate"
                    id="cash-credit-DOB"
                    label="Дата рождения"
                    control={control}
                    error={!!errors.birthDate?.message}
                    helperText={errors.birthDate?.message}
                    {...BIRTHDATE_CALENDAR_SETTINGS}
                />
                <Space>
                    <Controller
                        {...{ as: RadioButtonGroup }}
                        name="gender"
                        items={[
                            { label: 'Мужской', value: 'M' },
                            { label: 'Женский', value: 'F' },
                        ]}
                        activeBgColor="main-50"
                        control={control}
                    />

                    <FormCheckbox
                        id="cash-credit-agreement"
                        name="agreement"
                        error={!!errors.agreement?.message}
                        helperText={errors.agreement?.message}
                        control={control}
                    >
                        <Agreement
                            productType="cashCredit"
                            onClick={() => setValue('agreement', !getValues('agreement'))}
                            text="Я соглашаюсь с"
                            buttonText={'условиями передачи информации'}
                        />
                    </FormCheckbox>
                </Space>
                <FormButton valid={isValid} loading={isSubmitting}>
                    Продолжить
                </FormButton>
            </form>
        </FormWrapper>
    );
};
