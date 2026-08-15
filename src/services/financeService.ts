import { api } from '../lib/api';

export const financeService = {
    async getSummary() {
        return await api.get('/finances/summary');
    },

    async getTransactions() {
        return await api.get<any[]>('/finances/transactions');
    },

    async addTransaction(data: { type: 'income'|'expense', amount: number, description: string, transaction_date?: string }) {
        return await api.post('/finances/add', data);
    }
};
