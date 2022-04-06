import { Occupation } from '@components/Form/helpers/types';
import { splitFullName } from '@components/Form/widgets/helpers';
import { removeMask } from '@components/RKOForm/OpenAccountForm/helpers';
import { FORM_ALIAS } from '@constants/forms';
import { CASH_CREDIT_RATES } from '@features/Calculator/components/CreditCalculator/CreditCalculator';
import { FormActions, FormResponse } from '@services/form/types';
import { FORM_CORE_SESSION_UUID, personalLoan, submitSession } from '@services/formCore';
import { logEvent } from '@utils/analytics';
import { BackendServices, errorBoundary } from '@utils/errorBoundary';

import { CreditFormData } from './types';

export const postCashCreditForm = (formData: CreditFormData): Promise<FormResponse> => {
    const {
        phone,
        email,
        fullName,
        birthDate,
        gender,
        birthPlace,
        passportSeries,
        passportDate,
        passportDivisionCode,
        passportIssuer,
        passportNumber,
        creditAmount,
        creditTotalAmount,
        monthlyPayment,
        livingBuilding,
        registerArea,
        livingArea,
        livingCity,
        livingRegion,
        livingStreet,
        livingFlat,
        livingKorpus,
        registerCity,
        registerBuilding,
        registerStreet,
        registerFlat,
        registerKorpus,
        registrationAndLivingSame,
        registerRegion,
        creditPeriod,
        insurance,
        companyPhonenumber,
        companyPhoneAdditions,
        previousSurname,
        maritalStatus,
        incomeSource,
        incomeAmount,
        occupation,
        registerPostalCode,
        livingPostalCode,
        companyPostalCode,
        companyName,
        inn,
        filialCode,
        officeCity,
        officeRegion,
        companyType,
        extraIncome,
        extraIncomeAmount,
        livingLocality,
        extraIncomeSource,
        companyBuilding,
        employeeAmount,
        position,
        employmentStartDate,
        companyRegion,
        companyCity,
        creditPurpose,
        companyKorpus,
        companyStreet,
    } = formData;

    const { name, surname, patronymic } = splitFullName(fullName);

    const live_registration = registrationAndLivingSame ? { live_registration: '1' } : '';

    const hasExtraIncome = extraIncome
        ? {
              is_extra_income: '1',
              source_of_extra_income: extraIncomeSource,
              extra_income_sum: extraIncomeAmount.replace(/ |₽/gm, ''),
          }
        : '';

    const clientOccupation =
        occupation !== Occupation.RETIREE
            ? {
                  occupation,
                  job_area_type: '1',
                  job_street_type: '01',
              }
            : {
                  occupation,
              };

    const validatedName = {
        name: name.slice(0, 50),
        surname: surname.slice(0, 50),
        patronymic: patronymic.slice(0, 50),
    };

    const requestData = {
        redirect: (document?.referrer || window.location.href).split('?')[0],
        'credit_rate-ins': CASH_CREDIT_RATES.withInsurance,
        credit_rate: insurance
            ? CASH_CREDIT_RATES.withInsurance
            : CASH_CREDIT_RATES.withoutInsurance,
        product_title: 'Потребительский кредит',
        cvm_cycle_code: '',
        test:
            process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ||
            process.env.NEXT_PUBLIC_ENVIRONMENT === 'pre-production'
                ? false
                : true,
        surname: validatedName.surname,
        name: validatedName.name,
        second_name: validatedName.patronymic,
        sex: gender,
        birthd_date: birthDate,
        email,
        terms: '1',
        service_phone_confirmed: removeMask(phone),
        place_birth: birthPlace,
        passport_serial: removeMask(passportSeries),
        passport_number: removeMask(passportNumber),
        passport_date: passportDate,
        passport_data: passportIssuer,
        passport_code: removeMask(passportDivisionCode),
        last_surname: previousSurname,

        area_type: '1',
        office_region: officeRegion,
        office_city_name_test: officeCity,
        street_type: '01',
        street: registerStreet,
        home: registerBuilding.replace(' ', ''),
        building: registerKorpus,
        build: '', //Строение
        apartment: registerFlat.replace(' ', ''),

        live_area_type: '1',

        live_street_type: '01',
        live_street: livingStreet,
        live_build: livingBuilding.replace(' ', ''), //Дом,
        live_build_part2: livingKorpus.replace(' ', ''), // Корпус
        live_build_part: '', //Строение
        live_flat: livingFlat.replace(' ', ''), //Квартира
        ...live_registration,

        family: maritalStatus, // Семейное положение

        income: incomeAmount.replace(/ |₽/gm, ''), //Доход
        ...hasExtraIncome,

        last_work_date_start: employmentStartDate, //Дата начала работы в организации
        organization: companyName.slice(0, 100), // Наименование организации
        inn: inn,
        organization_form: companyType,
        employee_number: employeeAmount,
        job_type_1: '', //Занимаемая должность 1 пусто, надо попробовать отправить запрос без этого поля, оно не нужно на сайте и в крифе не обязательно

        job_type: position, //Занимаемая должность
        organization_phone: removeMask(companyPhonenumber), // Рабочий телефон
        organization_phone_2: companyPhoneAdditions,

        job_street: companyStreet,
        job_home: companyBuilding, //Дом (рабочий адрес)
        job_build: '', //Строение (рабочий адрес)
        job_building: companyKorpus,
        job_office: '', //Офис (рабочий адрес)
        credit_sum: creditAmount,
        credit_period: creditPeriod,
        credit_insurance: insurance ? '1' : '0',
        credit_pay_sum_result: creditTotalAmount, //Общая сумма кредита
        credt_pay_sum_month: monthlyPayment, //Ежемесячный платеж
        loan_purpose: creditPurpose,

        office_test: filialCode, //Код филиала code_crif
        is_draft: 'R',
        guid: sessionStorage.getItem(FORM_CORE_SESSION_UUID),
        region: registerRegion,
        city_name_test: registerCity,
        live_region: livingRegion,
        live_area_name: livingCity || livingLocality,
        job_region: companyRegion,
        profit: incomeSource,
        job_area_name_test: companyCity,
        postal_code: registerPostalCode,
        live_postal_code: livingPostalCode,
        job_postal_code: companyPostalCode,
        RegistrationAddressArea: registerArea,
        LivingAddressArea: livingArea,
        ...clientOccupation,
    };

    return new Promise((resolve, reject) => {
        personalLoan(requestData, 100)
            .then(({ data }) => {
                if (data.status === 'success' || data.success) {
                    submitSession(FORM_ALIAS.PersonalLoan)
                        .then(({ data: submitData }) => {
                            if (submitData.success) {
                                resolve(data);
                            } else {
                                errorBoundary({
                                    status: 600,
                                    service: BackendServices.Forms,
                                    action: FormActions.CashLoan,
                                });

                                logEvent({
                                    event: 'form_track',
                                    eventCategory: 'form_error',
                                    eventLabel: '600',
                                    eventAction: JSON.stringify({
                                        error: data.errors,
                                    }),
                                });

                                reject(data);
                            }
                        })
                        .catch((error) => {
                            errorBoundary({
                                status: error?.response?.status,
                                service: BackendServices.Forms,
                                action: FormActions.CashLoan,
                            });
                            reject(error);
                        });
                } else {
                    errorBoundary({
                        status: 600,
                        service: BackendServices.Forms,
                        action: FormActions.CashLoan,
                    });

                    logEvent({
                        event: 'form_track',
                        eventCategory: 'form_error',
                        eventLabel: '600',
                        eventAction: JSON.stringify({
                            error: data.errors,
                        }),
                    });

                    reject(data);
                }
            })
            .catch((error) => {
                errorBoundary({
                    status: error?.response?.status,
                    service: BackendServices.Forms,
                    action: FormActions.CashLoan,
                });
                reject(error);
            });
    });
};
