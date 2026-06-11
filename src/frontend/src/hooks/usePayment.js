import { useState } from 'react';
import { initiatePayment as apiInitiatePayment, submitQuery } from '../api/client';

export const usePayment = () => {
    const [machineState, setMachineState] = useState('IDLE');
    const [selectedService, setSelectedService] = useState(null);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [txGroupId, setLocalTxGroupId] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const selectService = (service) => {
        setSelectedService(service);
        setMachineState('SERVICE_SELECTED');
        setError(null);
    };

    const initiatePayment = async (walletAddress, prompt) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiInitiatePayment(selectedService.id, walletAddress, prompt);
            setSessionId(result.session_id);
            setMachineState('PAYMENT_PENDING');
        } catch (err) {
            setError(err.message);
            setMachineState('ERROR');
        } finally {
            setIsLoading(false);
        }
    };

    const setTxGroupId = (id) => {
        setLocalTxGroupId(id);
    };

    const submitForVerification = async () => {
        setIsLoading(true);
        setError(null);
        setMachineState('VERIFYING');
        try {
            const result = await submitQuery(sessionId, txGroupId);
            setAiResponse(result);
            setMachineState('SUCCESS');
        } catch (err) {
            setError(err.message);
            setMachineState('ERROR');
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setMachineState('IDLE');
        setSelectedService(null);
        setPaymentInfo(null);
        setSessionId(null);
        setLocalTxGroupId('');
        setAiResponse(null);
        setError(null);
        setIsLoading(false);
    };

    return {
        machineState, selectedService, paymentInfo, sessionId, txGroupId,
        aiResponse, error, isLoading,

        selectService, initiatePayment, setTxGroupId, submitForVerification, reset,
        setPaymentInfo
    };
};
