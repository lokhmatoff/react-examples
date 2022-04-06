import { FormButton } from '@components/Form/FormButton/FormButton';
import { FormCheckbox } from '@components/Form/FormCheckbox/FormCheckbox';
import { checkValidation, clearValues } from '@components/Form/helpers';
import Yup, {
    isDivisionCode,
    isPassportNumber,
    isPassportSeries,
} from '@components/Form/helpers/validations';
import {
    DaDataAddress,
    DaDataDivisionCode,
    DaDataDivisionCodeSuggestion,
    DatePicker,
    PassportNumber,
    PassportSeries,
} from '@components/Form/widgets';
import { DaDataSurname } from '@components/Form/widgets/DaDataWidgets/DaDataSurname/DaDataSurname';
import { FormWrapper } from '@components/retail/common/form-elements/FormWrapper';
import { yupResolver } from '@hookform/resolvers/dist/ie11/yup';
import { getAddress } from '@services/dadata/helpers';
import { sendShortOrderlog } from '@services/form';
import { Button, Col, Row, TextField } from '@ui';
import { ButtonGroup } from '@ui/ButtonGroup';
import { Space } from '@ui/Space';
import { useFormFocus } from 'hooks/useFormFocus';
import React, { ChangeEvent, useEffect } from 'react';
import { DaDataAddressSuggestion, DaDataFioSuggestion } from 'react-dadata';
import { Controller, useForm } from 'react-hook-form/dist/index.ie11';
import styled from 'reshadow';
import { getFormTouched } from 'utils/formTouched';

import { CreditFormData, FormControl } from '../types';
import baseStyles from './Steps.module.scss';

const livingAddressFields = [
    'livingBuilding',
    'livingStreet',
    'livingCity',
    'livingLocality',
    'livingFlat',
    'livingRegion',
    'livingFullAddress',
    'livingArea',
    'livingPostalCode',
];

const touched = getFormTouched('cash-credit-form');

export const PassportInfo: React.FC<FormControl> = ({
    applicationAnalyzer: { sessionEvents },
    data,
    setData,
    setMachineState,
}) => {
    touched.setDefaultTouched(data);

    const validationSchema = Yup.object().shape({
        passportSeries: isPassportSeries,
        passportNumber: isPassportNumber,
        passportDivisionCode: isDivisionCode,
        passportIssuer: Yup.string().required().notLatin().max(250),
        passportDate: Yup.string()
            .required()
            .isDate('Введите дату выдачи паспорта')
            .maxDate(new Date())
            .isValidPassportIssuedDate(data.birthDate),

        birthPlace: Yup.string().required().notLatin().max(100),
        registerFullAddress: Yup.string().required(),
        registerStreet: Yup.string(),
        registerBuilding: Yup.string().required('Введите точный адрес'),
        registerLocality: Yup.string(),
        registerCity: Yup.string().required(),
        registerRegion: Yup.string().required(),
        registerKorpus: Yup.string(),
        registerFlat: Yup.string(),
        livingFullAddress: Yup.string().when('registrationAndLivingSame', {
            is: false,
            then: Yup.string().required(),
        }),
        livingBuilding: Yup.string().when('registrationAndLivingSame', {
            is: false,
            then: Yup.string().required('Введите точный адрес'),
        }),
        livingCity: Yup.string().when('registrationAndLivingSame', {
            is: false,
            then: Yup.string().required(),
        }),
        surnameChanged: Yup.bool(),
        previousSurname: Yup.string().when('surnameChanged', {
            is: true,
            then: Yup.string()
                .required()
                .min(2, 'Недостаточно информации. Введите предыдущую фамилию'),
        }),
        livingFlat: Yup.string(),
        livingLocality: Yup.string(),
        livingPostalCode: Yup.string(),
        livingRegion: Yup.string().when('registrationAndLivingSame', {
            is: false,
            then: Yup.string().required(),
        }),
        livingStreet: Yup.string(),
        registrationAndLivingSame: Yup.boolean(),
    });

    const {
        control,
        handleSubmit,
        errors,
        formState,
        formState: { isValid, isSubmitting },
        setValue,
        watch,
        trigger,
        getValues,
    } = useForm({
        defaultValues: {
            ...data,
        },
        shouldUnregister: false,
        shouldFocusError: true,
        resolver: yupResolver(validationSchema),
        mode: 'onTouched',
    });

    const registrationAndLivingSame = watch('registrationAndLivingSame');

    const onSubmit = async (formData: CreditFormData) => {
        setData({
            ...data,
            ...formData,
        });
        setMachineState({ type: 'INCOME_INFO' });

        sendShortOrderlog(formData, 'Нажата кнопка Далее');

        sessionEvents.formStepComplete();
    };

    const formInfo = {
        touched: touched.getTouched(),
        formState,
    };

    const handleRegisterAddressSelect = (option: DaDataAddressSuggestion) => {
        const { fullAddress, postalCode, regionKladr, street, building, block, city, flat, area } =
            getAddress(option);

        //Set Required Parameters for Form Data
        setValue('registerFullAddress', fullAddress);
        setValue('registerPostalCode', postalCode);
        setValue('registerRegion', regionKladr);
        setValue('registerStreet', street.slice(0, 50) || city.slice(0, 50));
        setValue('registerBuilding', building);
        setValue('registerCity', city);
        setValue('registerFlat', flat);
        setValue('registerKorpus', block);
        setValue('registerArea', area.slice(0, 50));
        trigger(['registerBuilding', 'registerCity']);

        touched.setTouched([
            'registerBuilding',
            'registerStreet',
            'registerCity',
            'registerLocality',
            'registerFlat',
            'registerRegion',
        ]);
    };

    const handleReturn = () => {
        const filledValues = getValues();
        setData({
            ...data,
            ...filledValues,
        });
        setMachineState({ type: 'BACK' });
    };

    const clearLivingAddressValues = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            clearValues(setValue, livingAddressFields);
        }
    };

    const handleLivingAddressSelect = (option: DaDataAddressSuggestion) => {
        const { fullAddress, postalCode, regionKladr, street, building, block, city, flat, area } =
            getAddress(option);

        //Set Required Parameters for Form Data
        setValue('livingFullAddress', fullAddress);
        setValue('livingPostalCode', postalCode);
        setValue('livingRegion', regionKladr);
        setValue('livingStreet', street.slice(0, 50) || city.slice(0, 50));
        setValue('livingBuilding', building);
        setValue('livingCity', city);
        setValue('livingFlat', flat);
        setValue('livingKorpus', block);
        setValue('livingArea', area.slice(0, 50));
        trigger(['livingBuilding', 'livingCity']);

        touched.setTouched(livingAddressFields);
    };

    const handleDivisionCode = (option: DaDataDivisionCodeSuggestion) => {
        setValue('passportIssuer', option.value);
        setValue('passportDivisionCode', option.data.code);
        touched.setTouched('passportIssuer');
        trigger(['passportIssuer', 'passportDivisionCode']);

        setTimeout(() => {
            if (control && control.fieldsRef.current.birthPlace?.ref?.focus) {
                control.fieldsRef.current.birthPlace?.ref?.focus();
            }
        });
    };
    const formRef = useFormFocus();

    useEffect(() => {
        if (control && control.fieldsRef.current.passportSeries?.ref?.focus) {
            control.fieldsRef.current.passportSeries?.ref?.focus();
        }
    }, []);

    const handleSurnameChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.checked) {
            setValue('previousSurname', '');
        }
    };

    const previoustSurname = watch('previousSurname');
    const surnameChanged = watch('surnameChanged');
    const livingBuilding = watch('livingBuilding');

    return styled(baseStyles)(
        <FormWrapper>
            <form
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                ref={formRef}
                data-form-step="3"
                method="post"
            >
                <Row>
                    <Col col={{ md: 6 }}>
                        <Controller
                            {...{ as: PassportSeries }}
                            name="passportSeries"
                            id="cash-credit-passport-series"
                            label="Серия"
                            error={!!errors.passportSeries?.message}
                            helperText={errors.passportSeries?.message}
                            trailing={checkValidation(formInfo, 'passportSeries')}
                            control={control}
                        />
                    </Col>
                    <Col col={{ md: 6 }}>
                        <Controller
                            {...{ as: PassportNumber }}
                            name="passportNumber"
                            id="cash-credit-passport-number"
                            error={!!errors.passportNumber?.message}
                            helperText={errors.passportNumber?.message}
                            trailing={checkValidation(formInfo, 'passportNumber')}
                            control={control}
                            label="Номер"
                        />
                    </Col>
                </Row>
                <Row>
                    <Col col={{ md: 6 }}>
                        <Controller
                            {...{ as: DatePicker }}
                            name="passportDate"
                            id="cash-credit-passport-date"
                            toMonth={new Date()}
                            disabledDays={{ after: new Date() }}
                            error={!!errors.passportDate?.message}
                            helperText={errors.passportDate?.message}
                            label="Дата выдачи"
                            control={control}
                        />
                    </Col>
                    <Col col={{ md: 6 }}>
                        <Controller
                            {...{ as: DaDataDivisionCode }}
                            control={control}
                            name="passportDivisionCode"
                            onOptionSelect={handleDivisionCode}
                            id="cash-credit-passport-division-code"
                            error={!!errors.passportDivisionCode?.message}
                            helperText={errors.passportDivisionCode?.message}
                            trailing={checkValidation(formInfo, 'passportDivisionCode')}
                            label="Код подразделения"
                        />
                    </Col>
                </Row>
                <Controller
                    {...{ as: TextField }}
                    name="passportIssuer"
                    id="cash-credit-passport-issuer"
                    error={!!errors.passportIssuer?.message}
                    helperText={errors.passportIssuer?.message}
                    trailing={checkValidation(formInfo, 'passportIssuer')}
                    label="Кем выдан"
                    control={control}
                />
                <Controller
                    {...{ as: TextField }}
                    name="birthPlace"
                    id="cash-credit-birth-place"
                    error={!!errors.birthPlace?.message}
                    helperText={errors.birthPlace?.message}
                    trailing={checkValidation(formInfo, 'birthPlace')}
                    placeholder="Укажите как в паспорте"
                    label="Место рождения"
                    control={control}
                />
                <Space>
                    <FormCheckbox
                        control={control}
                        onChange={handleSurnameChange}
                        name="surnameChanged"
                        id="cash-credit-surname-changed"
                        label="Фамилия менялась"
                    />
                </Space>
                {surnameChanged && (
                    <Controller
                        {...{ as: DaDataSurname }}
                        name="previousSurname"
                        onOptionSelect={({ value }: DaDataFioSuggestion) =>
                            setValue('previousSurname', value)
                        }
                        id="cash-credit-previous-surname"
                        label="Предыдущая фамилия"
                        error={!!errors?.previousSurname?.message}
                        helperText={errors?.previousSurname?.message}
                        trailing={previoustSurname && checkValidation(formInfo, 'previousSurname')}
                        control={control}
                    />
                )}
                <Controller
                    {...{ as: DaDataAddress }}
                    name="registerFullAddress"
                    id="cash-credit-register-address"
                    label="Адрес регистрации"
                    onOptionSelect={handleRegisterAddressSelect}
                    control={control}
                    error={
                        !!errors?.registerFullAddress?.message ||
                        !!errors?.registerBuilding?.message ||
                        !!errors.registerCity?.message
                    }
                    helperText={
                        errors.registerFullAddress?.message ||
                        errors?.registerBuilding?.message ||
                        errors.registerCity?.message
                    }
                    trailing={checkValidation(formInfo, 'registerBuilding')}
                />
                <Space>
                    <FormCheckbox
                        control={control}
                        name="registrationAndLivingSame"
                        onChange={clearLivingAddressValues}
                        id="cash-credit-registrationAndLivingSame"
                        label="Проживаю по месту регистрации"
                    />
                </Space>
                {!registrationAndLivingSame && (
                    <Controller
                        {...{ as: DaDataAddress }}
                        name="livingFullAddress"
                        id="cash-credit-livingAddress"
                        label="Фактический адрес проживания"
                        onOptionSelect={handleLivingAddressSelect}
                        error={
                            !!errors?.livingFullAddress?.message ||
                            !!errors.livingBuilding?.message ||
                            !!errors.livingCity?.message
                        }
                        helperText={
                            errors?.livingFullAddress?.message ||
                            errors.livingBuilding?.message ||
                            errors.livingCity?.message
                        }
                        trailing={
                            livingBuilding ? checkValidation(formInfo, 'livingBuilding') : null
                        }
                        control={control}
                    />
                )}
                <ButtonGroup justifyContent="center">
                    <Button type="button" variant="secondary" onClick={handleReturn} noBorder>
                        Предыдущий шаг
                    </Button>
                    <FormButton loading={isSubmitting} valid={isValid}>
                        Следующий шаг
                    </FormButton>
                </ButtonGroup>
            </form>
        </FormWrapper>
    );
};
