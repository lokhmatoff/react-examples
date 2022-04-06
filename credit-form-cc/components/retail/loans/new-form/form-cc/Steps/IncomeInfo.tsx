import { FormButton } from '@components/Form/FormButton/FormButton';
import { FormCheckbox } from '@components/Form/FormCheckbox/FormCheckbox';
import {
    checkValidation,
    incomeSourceList,
    martialStatusList,
    occupationsList,
} from '@components/Form/helpers';
import { CompanyTypes, IncomeSource, Occupation } from '@components/Form/helpers/types';
import Yup from '@components/Form/helpers/validations';
import {
    DaDataAddress,
    DaDataOrganizations,
    DatePicker,
    PhoneWidget,
} from '@components/Form/widgets';
import { AdditionalIncomeField } from '@components/Form/widgets/AdditionIncomeField';
import { AmountField } from '@components/Form/widgets/AmountField/AmountField';
import { PhoneAdditions } from '@components/Form/widgets/PhoneAdditions/PhoneAdditions';
import { FormWrapper } from '@components/retail/common/form-elements/FormWrapper';
import { yupResolver } from '@hookform/resolvers/dist/ie11/yup';
import { dadata } from '@services/dadata';
import { getAddress, getCompanyType, getEmployeeCount } from '@services/dadata/helpers';
import { sendShortOrderlog } from '@services/form';
import { Button, Col, Row, TextField, Typography } from '@ui';
import { ButtonGroup } from '@ui/ButtonGroup';
import { Select } from '@ui/Select/Select';
import { Space } from '@ui/Space';
import { addYears, parse, subMonths } from 'date-fns';
import { useFormFocus } from 'hooks/useFormFocus';
import React, { useEffect } from 'react';
import { DaDataAddressSuggestion, DaDataPartySuggestion } from 'react-dadata';
import { Controller, useForm } from 'react-hook-form/dist/index.ie11';
import styled, { use } from 'reshadow';
import { getFormTouched } from 'utils/formTouched';

import { postCashCreditForm } from '../requests';
import { CreditFormData, FormControl } from '../types';
import baseStyles from './Steps.module.scss';

const companySize = [
    { label: 'менее 10', value: '01' },
    { label: 'от 10 до 20', value: '02' },
    { label: 'от 20 до 50', value: '03' },
    { label: 'от 50 до 100', value: '04' },
    { label: 'от 100 до 250', value: '05' },
    { label: 'более 250', value: '06' },
];

const extraIncomeList = [
    { label: 'Доход от сдачи в аренду имущества', value: '02' },
    { label: 'Алименты', value: '03' },
    { label: 'Пенсия', value: '04' },
    { label: 'Заработная плата', value: '06' },
    { label: 'Предпринимательство', value: '07' },
];

const touched = getFormTouched('cash-credit-form');

export const IncomeInfo: React.FC<FormControl> = ({
    applicationAnalyzer: { sessionEvents },
    data,
    setData,
    setMachineState,
}) => {
    const parsedAge = parse(data.birthDate, 'dd.MM.yyyy', new Date());

    const EMPLOYMENT_START_DATE_SETTINGS = {
        // current month-3months <start date<age+14
        disabledDays: { before: addYears(parsedAge, 14), after: subMonths(new Date(), 3) },
        fromMonth: addYears(parsedAge, 14),
        initialMonth: subMonths(new Date(), 3),
        toMonth: subMonths(new Date(), 3),
    };

    const validationSchema = Yup.object().shape({
        occupation: Yup.string().required(),
        incomeSource: Yup.string().required(),
        incomeAmount: Yup.string().required().minAmount(1, 'Сумма дохода не может быть 0 ₽'),
        maritalStatus: Yup.string().required(),
        companyName: Yup.string().when('occupation', {
            is: Occupation.RETIREE,
            otherwise: Yup.string().required(),
        }),
        inn: Yup.string().when('occupation', {
            is: Occupation.RETIREE,
            otherwise: Yup.string().required().innLength().inn(),
        }),
        companyType: Yup.string().when('occupation', {
            is: Occupation.RETIREE,
            otherwise: Yup.string()
                .required()
                .when('inn', {
                    is: (inn: string) => inn?.length === 10,
                    then: Yup.string().notOneOf(
                        [CompanyTypes.IP],
                        'Неверно выбрана форма собственности, проверьте ИНН.'
                    ),
                    otherwise: Yup.string().oneOf(
                        [CompanyTypes.IP],
                        'Неверно выбрана форма собственности, проверьте ИНН.'
                    ),
                }),
        }),
        employeeAmount: Yup.string().when('occupation', {
            is: Occupation.RETIREE,
            otherwise: Yup.string().required(),
        }),
        position: Yup.string().when('occupation', {
            is: (occupation: Occupation) =>
                occupation === Occupation.BUSINESS_OWNER || occupation === Occupation.EMPLOYEE,
            then: Yup.string().required().max(250),
        }),
        companyPhonenumber: Yup.string().when('occupation', {
            is: Occupation.RETIREE,
            otherwise: Yup.string()
                .required()
                .phoneNumber()
                .notOneOf(
                    [data.phone],
                    'Рабочий телефон не должен дублировать личный номер телефона'
                ),
        }),
        employmentStartDate: Yup.string().when('occupation', {
            is: Occupation.RETIREE,
            otherwise: Yup.string()
                .required()
                .isDate()
                .minDate(
                    addYears(parsedAge, 14),
                    'Дата не может быть ранее достижения 14-летнего возраста'
                )
                .maxDate(
                    subMonths(new Date(), 3),
                    'Длительность работы не должна быть меньше 3 месяцев'
                ),
        }),
        extraIncome: Yup.boolean(),
        extraIncomeSource: Yup.string().when('extraIncome', {
            is: true,
            then: Yup.string().required(),
        }),
        extraIncomeAmount: Yup.string().when('extraIncome', {
            is: true,
            then: Yup.string().required().minAmount(1, 'Сумма доп. дохода не может быть 0 ₽'),
        }),

        companyPhoneAdditions: Yup.string(),
        companyAddress: Yup.string().when('occupation', {
            is: Occupation.RETIREE,
            otherwise: Yup.string().required(),
        }),
        companyCity: Yup.string().when('occupation', {
            is: Occupation.RETIREE,
            otherwise: Yup.string(),
        }),
        companyBuilding: Yup.string().when('occupation', {
            is: Occupation.RETIREE,
            otherwise: Yup.string().required('Введите точный адрес'),
        }),
    });

    touched.setDefaultTouched(data);

    const {
        control,
        handleSubmit,
        errors,
        formState,
        getValues,
        formState: { isValid, isSubmitting },
        setValue,
        watch,
        trigger,
    } = useForm({
        defaultValues: {
            ...data,
        },

        resolver: yupResolver(validationSchema),
        mode: 'onTouched',
    });
    const inn = watch('inn');

    const companyTypes = [
        { label: 'Смешанная, НКО', value: CompanyTypes.NKO },
        { label: 'Частная (ООО)', value: CompanyTypes.OOO },
        {
            label: 'Частная (ИП)',
            value: CompanyTypes.IP,
            disabled: inn && inn.length !== 12 ? true : false,
        },
        { label: 'Частная (ОАО/ПАО)', value: CompanyTypes.OAO },
        { label: 'Частная (ЗАО/АО)', value: CompanyTypes.ZAO },
        { label: 'Государственная', value: CompanyTypes.GOVERMENT },
        { label: 'Прочие организации', value: CompanyTypes.OTHERS },
    ];
    const onSubmit = async (formData: CreditFormData) => {
        const mergedFormData = { ...data, ...formData };

        const formSubmitted = await postCashCreditForm(mergedFormData);
        setData({
            ...data,
            ...formData,
        });

        sendShortOrderlog(mergedFormData, 'Нажата кнопка Отправить');

        if (formSubmitted.success) {
            setMachineState({ type: 'SUCCESS' });

            sessionEvents.formSubmit({
                symfony_id: formSubmitted.fc_request_id ?? null,
            });
        } else {
            sessionEvents.formValidationError();
        }
    };

    const formInfo = {
        touched: touched.getTouched(),
        formState,
        getValues,
    };

    const handleCompanyAddressSelect = (option: DaDataAddressSuggestion) => {
        const { fullAddress, regionKladr, street, building, block, city } = getAddress(option);

        //Set Required Parameters for Form Data
        setValue('companyAddress', fullAddress);
        setValue('companyRegion', regionKladr.slice(0, 2));
        setValue('companyStreet', street.slice(0, 50));
        setValue('companyBuilding', building);
        setValue('companyCity', city);
        setValue('companyKorpus', block);

        trigger('companyBuilding');
    };
    const companyType = watch('companyType');
    const handleCompanySelect = (option: DaDataPartySuggestion) => {
        setValue('inn', option.data.inn);

        touched.setTouched(['inn', 'companyName']);
        setValue('companyName', option.value);
        trigger(['inn', 'companyName']);

        if (option.data.opf.code) {
            setValue('companyType', getCompanyType(option.data));
        }

        trigger('companyType');

        dadata
            .getCompanyByINN({
                params: {
                    count: 1,
                    query: option.data.inn,
                },
            })
            .then((res) => {
                setValue('employeeAmount', getEmployeeCount(res.data.suggestions[0]));
            });
        (document.activeElement as HTMLElement).blur();
    };

    useEffect(() => {
        if (inn.length === 12) {
            setValue('companyType', CompanyTypes.IP, { shouldValidate: true });
        }

        if ((inn.length === 10 || inn.length === 12) && companyType) {
            trigger('companyType');
        }
    }, [inn]);

    const handleReturn = () => {
        const filledValues = getValues();
        setData({
            ...data,
            ...filledValues,
        });
        setMachineState({ type: 'BACK' });
    };
    const occupation = watch('occupation');

    const extraIncome = watch('extraIncome');
    const positionRequired =
        occupation === Occupation.BUSINESS_OWNER || occupation === Occupation.EMPLOYEE;

    useEffect(() => {
        switch (occupation) {
            case Occupation.EMPLOYEE:
                setValue('incomeSource', IncomeSource.SALARY);
                break;
            case Occupation.BUSINESS_OWNER:
                setValue('incomeSource', IncomeSource.SALARY);
                break;
            case Occupation.ENTREPRENEUR:
                setValue('incomeSource', IncomeSource.ENTREPRENEURSHIP);
                break;
            case Occupation.RETIREE:
                setValue('incomeSource', IncomeSource.PENSION);
                break;
        }
    }, [occupation]);
    const notRetiree = occupation !== Occupation.RETIREE && occupation !== '';

    const formRef = useFormFocus();
    const companyPhoneAdditions = watch('companyPhoneAdditions');
    return styled(baseStyles)(
        <FormWrapper>
            <form
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                ref={formRef}
                data-form-step="4"
                method="post"
            >
                <Row>
                    <Col col={{ md: 6 }}>
                        <Controller
                            {...{ as: Select }}
                            options={occupationsList}
                            label="Род занятости"
                            name="occupation"
                            id="cash-credit-occupation"
                            error={!!errors.occupation?.message}
                            helperText={errors.occupation?.message}
                            control={control}
                        />
                    </Col>
                    <Col col={{ md: 6 }}>
                        <Controller
                            {...{ as: Select }}
                            options={incomeSourceList}
                            name="incomeSource"
                            id="cash-credit-income-source"
                            label="Источник дохода"
                            type="hidden"
                            error={!!errors.incomeSource?.message}
                            helperText={errors.incomeSource?.message}
                            control={control}
                        />
                        <Controller
                            {...{ as: Select }}
                            options={martialStatusList}
                            name="maritalStatus"
                            id="cash-credit-marital-status"
                            label="Семейное положение"
                            error={!!errors.maritalStatus?.message}
                            helperText={errors.maritalStatus?.message}
                            control={control}
                        />
                    </Col>
                </Row>

                <Controller
                    {...{ as: AmountField }}
                    name="incomeAmount"
                    id="cash-credit-income-amount"
                    error={!!errors.incomeAmount?.message}
                    helperText={errors.incomeAmount?.message}
                    trailing={checkValidation(formInfo, 'incomeAmount')}
                    label="Сумма основного дохода за месяц"
                    control={control}
                    maxLength={11}
                    inputMode="numeric"
                />
                <Space>
                    <FormCheckbox
                        id="cash-credit-extra-income"
                        name="extraIncome"
                        control={control}
                        label="Имеется дополнительный доход"
                    />
                </Space>
                {extraIncome && (
                    <>
                        <Controller
                            {...{ as: Select }}
                            options={extraIncomeList}
                            name="extraIncomeSource"
                            id="cash-credit-income-source"
                            label="Источник дополнительного дохода"
                            error={!!errors.extraIncomeSource?.message}
                            helperText={errors.extraIncomeSource?.message}
                            control={control}
                        />
                        <Controller
                            {...{ as: AdditionalIncomeField }}
                            name="extraIncomeAmount"
                            id="cash-credit-extra-amount"
                            error={!!errors.extraIncomeAmount?.message}
                            helperText={errors.extraIncomeAmount?.message}
                            trailing={checkValidation(formInfo, 'extraIncomeAmount')}
                            label="Сумма доп.дохода за месяц"
                            control={control}
                            maxLength={12}
                            inputMode="numeric"
                        />
                    </>
                )}
                {notRetiree && (
                    <>
                        <Space>
                            <Typography variant="p" {...use({ helperText: true })}>
                                Заполните информацию о вашем последнем месте работы
                            </Typography>
                        </Space>
                        <Row>
                            <Col col={{ md: 6 }}>
                                <Controller
                                    {...{ as: DaDataOrganizations }}
                                    name="companyName"
                                    onOptionSelect={handleCompanySelect}
                                    id="cash-credit-company-name"
                                    error={!!errors.companyName?.message}
                                    helperText={errors.companyName?.message}
                                    trailing={checkValidation(formInfo, 'companyName')}
                                    label="Наименование организации"
                                    maxLength={100}
                                    control={control}
                                />
                            </Col>
                            <Col col={{ md: 6 }}>
                                <Controller
                                    {...{ as: DaDataOrganizations }}
                                    onOptionSelect={handleCompanySelect}
                                    priority="inn"
                                    id="cash-credit-inn"
                                    name="inn"
                                    inputMode="numeric"
                                    label="Инн"
                                    control={control}
                                    error={!!errors.inn?.message}
                                    helperText={errors.inn?.message}
                                    trailing={checkValidation(formInfo, 'inn')}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col col={{ md: 6 }}>
                                <Controller
                                    {...{ as: Select }}
                                    name="companyType"
                                    id="cash-credit-company-type"
                                    options={companyTypes}
                                    control={control}
                                    label="Форма собственности"
                                    error={!!errors.companyType?.message}
                                    helperText={errors.companyType?.message}
                                />
                            </Col>
                            <Col col={{ md: 6 }}>
                                <Controller
                                    {...{ as: Select }}
                                    id="cash-credit-employee-amount"
                                    options={companySize}
                                    name="employeeAmount"
                                    label="Численность сотрудников"
                                    control={control}
                                    error={!!errors.employeeAmount?.message}
                                    helperText={errors.employeeAmount?.message}
                                />
                            </Col>
                        </Row>
                        <Row>
                            {positionRequired && (
                                <Col col={{ md: 6 }}>
                                    <Controller
                                        {...{ as: TextField }}
                                        id="cash-credit-position"
                                        name="position"
                                        label="Занимаемая должность"
                                        control={control}
                                        error={!!errors.position?.message}
                                        helperText={errors.position?.message}
                                        trailing={checkValidation(formInfo, 'position')}
                                    />
                                </Col>
                            )}

                            <Col col={{ md: positionRequired ? 6 : 12 }}>
                                <Controller
                                    {...{ as: DatePicker }}
                                    name="employmentStartDate"
                                    id="cash-credit-employment-duration"
                                    error={!!errors.employmentStartDate?.message}
                                    helperText={errors.employmentStartDate?.message}
                                    label="Дата начала работы"
                                    control={control}
                                    {...EMPLOYMENT_START_DATE_SETTINGS}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col col={{ md: 6 }}>
                                <Controller
                                    {...{ as: PhoneWidget }}
                                    name="companyPhonenumber"
                                    id="cash-credit-company-phonenumber"
                                    error={!!errors.companyPhonenumber?.message}
                                    helperText={errors.companyPhonenumber?.message}
                                    trailing={checkValidation(formInfo, 'companyPhonenumber')}
                                    label="Рабочий телефон"
                                    control={control}
                                />
                            </Col>
                            <Col col={{ md: 6 }}>
                                <Controller
                                    {...{ as: PhoneAdditions }}
                                    id="cash-credit-additional-numbers"
                                    name="companyPhoneAdditions"
                                    label="Добавочный номер телефона"
                                    control={control}
                                    trailing={
                                        companyPhoneAdditions
                                            ? checkValidation(formInfo, 'companyPhoneAdditions')
                                            : null
                                    }
                                />
                            </Col>
                        </Row>
                        <Controller
                            {...{ as: DaDataAddress }}
                            name="companyAddress"
                            id="companyAddress"
                            label="Фактический адрес места работы"
                            onOptionSelect={handleCompanyAddressSelect}
                            control={control}
                            error={
                                !!errors?.companyAddress?.message ||
                                !!errors?.companyBuilding?.message
                            }
                            helperText={
                                errors.companyAddress?.message || errors?.companyBuilding?.message
                            }
                            trailing={checkValidation(formInfo, 'companyBuilding')}
                        />
                        <Controller
                            {...{ as: TextField }}
                            type="hidden"
                            name="companyBuilding"
                            id="companyBuilding"
                            label=""
                            control={control}
                        />
                        <Controller
                            {...{ as: TextField }}
                            type="hidden"
                            name="companyStreet"
                            id="companyStreet"
                            label=""
                            control={control}
                        />
                        <Controller
                            {...{ as: TextField }}
                            type="hidden"
                            name="companyCity"
                            id="companyCity"
                            label=""
                            control={control}
                        />
                        <Controller
                            {...{ as: TextField }}
                            type="hidden"
                            name="companyRegion"
                            id="companyRegion"
                            label=""
                            control={control}
                        />
                        <Controller
                            {...{ as: TextField }}
                            type="hidden"
                            name="companyKorpus"
                            id="companyKorpus"
                            label=""
                            control={control}
                        />
                    </>
                )}

                <ButtonGroup justifyContent="center">
                    <Button type="button" variant="secondary" onClick={handleReturn} noBorder>
                        Предыдущий шаг
                    </Button>
                    <FormButton valid={isValid} loading={isSubmitting}>
                        Отправить заявку
                    </FormButton>
                </ButtonGroup>
            </form>
        </FormWrapper>
    );
};
