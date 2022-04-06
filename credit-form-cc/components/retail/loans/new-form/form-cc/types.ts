import { IncomeSource, Occupation } from '@components/Form/helpers/types';
import { ApplicationAnalyzerSteps } from '@services/application-analyzer';
import { IOffices } from '@services/posfeeder/types';
import { EventData, State } from 'xstate';

import { CreditFormMachineContext, CreditFormMachineState } from './creditFormMachine';

export enum CreditPurpose {
    REFIN = '20',
    OTHERS = '22',
}

export interface CreditFormData {
    // Personal Info
    fullName: string;
    phone: string;
    email: string;
    birthDate: string;
    acception: '1';
    gender: 'M' | 'F';
    agreement: boolean;
    phcc: string;
    token: string;

    // Credit Params
    creditAmount: string;
    creditPeriod: string;
    insurance: boolean;
    hash: string;
    creditTotalAmount: string;
    monthlyPayment: string;
    creditPurpose: string;
    officeRegion: string;
    officeCity: string;
    officeBranch: string;
    filialCode: string;
    selectedOffice: IOffices | undefined;

    // Personal Info
    passportSeries: string;
    passportNumber: string;
    passportDivisionCode: string;
    passportIssuer: string;
    passportDate: string;
    birthPlace: string;
    surnameChanged: boolean;
    previousSurname: string;

    registerFullAddress: string;
    registerRegion: string;
    registerCity: string;
    registerStreet: string;
    registerBuilding: string;
    registerFlat: string;
    registerKorpus: string;
    registerLocality: string;
    registerPostalCode: string;
    registerArea: string;

    registrationAndLivingSame: boolean;
    livingFullAddress: string;
    livingCity: string;
    livingRegion: string;
    livingLocality: string;
    livingStreet: string;
    livingBuilding: string;
    livingKorpus: string;
    livingFlat: string;
    livingPostalCode: string;
    livingArea: string;
    // Income Info

    occupation: Occupation | '';
    incomeSource: IncomeSource | '';
    incomeAmount: string;
    maritalStatus: string;
    extraIncome: boolean;
    extraIncomeSource: string;
    extraIncomeAmount: string;
    companyName: string;
    inn: string;
    companyType: string;
    employeeAmount: string;
    position: string;
    employmentStartDate: string;
    companyPhonenumber: string;
    companyPhoneAdditions: string;
    companyAddress: string;
    companyRegion: string;
    companyLocality: string;
    companyCity: string;
    companyStreet: string;
    companyBuilding: string;
    companyKorpus: string;
    companyPostalCode: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FormControl {
    applicationAnalyzer: ApplicationAnalyzerSteps;
    data: CreditFormData;
    setData: React.Dispatch<React.SetStateAction<CreditFormData>>;
    setMachineState: (
        event: any,
        payload?: EventData | undefined
    ) => State<CreditFormMachineContext, any, any, CreditFormMachineState>;
    machineState: State<CreditFormMachineContext, any, any, CreditFormMachineState>;
}
