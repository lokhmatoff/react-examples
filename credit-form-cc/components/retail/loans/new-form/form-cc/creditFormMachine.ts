import { logFormSend } from 'services/form';
import { assign, createMachine } from 'xstate';
export interface CreditFormMachineContext {
    formInteractionStarted: boolean;
}

export type CreditFormMachineEvents =
    | { type: 'PASSPORT_INFO' }
    | { type: 'FINISH' }
    | { type: 'INCOME_INFO' }
    | { type: 'BACK' }
    | { type: 'CREDIT_PARAMETERS' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | any;

export type CreditFormMachineState =
    | {
          value: 'personalInfo';
          context: CreditFormMachineContext;
      }
    | {
          value: 'creditParameters';
          context: CreditFormMachineContext;
      }
    | {
          value: 'passportInfo';
          context: CreditFormMachineContext;
      }
    | {
          value: 'incomeInfo';
          context: CreditFormMachineContext;
      }
    | {
          value: 'success';
          context: CreditFormMachineContext;
      };

export const creditFormMachine = createMachine<
    CreditFormMachineContext,
    CreditFormMachineEvents,
    CreditFormMachineState
>(
    {
        id: 'credit-form',
        initial: 'personalInfo',
        context: {
            formInteractionStarted: false,
        },
        states: {
            personalInfo: {
                on: {
                    CREDIT_PARAMETERS: 'creditParameters',
                    START: {
                        actions: assign<CreditFormMachineContext>({ formInteractionStarted: true }),
                    },
                },
            },
            creditParameters: {
                on: {
                    PASSPORT_INFO: 'passportInfo',
                    personalInfo: 'personalInfo',
                    BACK: 'personalInfo',
                },
            },
            passportInfo: {
                on: {
                    INCOME_INFO: 'incomeInfo',
                    BACK: 'creditParameters',
                    personalInfo: 'personalInfo',
                    creditParameters: 'creditParameters',
                },
            },
            incomeInfo: {
                on: {
                    SUCCESS: 'success',
                    BACK: 'passportInfo',
                    personalInfo: 'personalInfo',
                    creditParameters: 'creditParameters',
                    passportInfo: 'passportInfo',
                },
            },
            success: {
                type: 'final',
                entry: ['logFormSend'],
            },
        },
    },
    {
        actions: {
            logFormSend,
        },
    }
);
