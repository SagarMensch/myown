import { Invoice, ChatMessage } from '../types';

export const getDisputeMessages = (invoice: Invoice): ChatMessage[] => {
    return invoice.dispute?.messages || [];
};

export const sendMessage = (invoice: Invoice, content: string, sender: string, role: 'VENDOR' | 'AUDITOR' | 'SYSTEM', isInternal: boolean = false): Invoice => {
    const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: sender,
        role: role,
        content: content,
        timestamp: new Date().toISOString(),
        isInternal: isInternal
    };

    // ensure dispute object exists
    const updatedInvoice = { ...invoice };
    if (!updatedInvoice.dispute) {
        updatedInvoice.dispute = {
            status: 'OPEN',
            messages: [],
            history: []
        };
    }

    // Append message
    updatedInvoice.dispute.messages = [...updatedInvoice.dispute.messages, newMessage];

    // Auto-update status if vendor replies
    if (role === 'VENDOR' && updatedInvoice.dispute.status === 'OPEN') {
        updatedInvoice.dispute.status = 'VENDOR_RESPONDED';
        updatedInvoice.dispute.history.push({
            actor: 'Vendor',
            timestamp: new Date().toISOString(),
            action: 'Vendor Replied',
            comment: 'Vendor posted a message via Dispute Chat.'
        });
    }

    // Auto-update status if Auditor replies
    if (role === 'AUDITOR' && updatedInvoice.dispute.status === 'VENDOR_RESPONDED') {
        updatedInvoice.dispute.status = 'UNDER_REVIEW';
        updatedInvoice.dispute.history.push({
            actor: 'SCM',
            timestamp: new Date().toISOString(),
            action: 'Auditor Replied',
            comment: 'Auditor posted a message via Dispute Chat.'
        });
    }

    return updatedInvoice;
};
