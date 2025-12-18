import { SpotIndent, SpotVendor, SpotVendorRequest, SpotBid } from '../types';

// --- SEED DATA: SPOT VENDORS ---
const SEED_VENDORS: SpotVendor[] = [
    { id: 'V-SPOT-001', name: 'Sharma Transporters', gstin: '27AABCS1234H1Z5', phone: '+919876543210', rating: 3.5 },
    { id: 'V-SPOT-002', name: 'VRL Logistics', gstin: '29AABCV5555L1Z2', phone: '+919988776655', rating: 4.8 },
    { id: 'V-SPOT-003', name: 'Ghatge Patil', gstin: '27AAACG6666J1Z9', phone: '+919123456789', rating: 4.2 }
];

class SpotService {
    private INDENT_KEY = 'spot_indents_v1';
    private VENDOR_KEY = 'spot_vendors_v1';

    private indents: SpotIndent[] = [];
    private vendors: SpotVendor[] = [];

    constructor() {
        this.load();
    }

    private load() {
        const iStorage = localStorage.getItem(this.INDENT_KEY);
        const vStorage = localStorage.getItem(this.VENDOR_KEY);

        if (vStorage) {
            this.vendors = JSON.parse(vStorage);
        } else {
            this.vendors = SEED_VENDORS;
            this.saveVendors();
        }

        if (iStorage) {
            this.indents = JSON.parse(iStorage);
        }
    }

    private saveIndents() {
        localStorage.setItem(this.INDENT_KEY, JSON.stringify(this.indents));
    }

    private saveVendors() {
        localStorage.setItem(this.VENDOR_KEY, JSON.stringify(this.vendors));
    }

    // --- READERS ---
    getVendors(): SpotVendor[] {
        return this.vendors;
    }

    getAllIndents(): SpotIndent[] {
        this.load();
        return this.indents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    getIndentById(id: string): SpotIndent | undefined {
        return this.indents.find(i => i.id === id);
    }

    // Helper for Guest Page
    getRequestByToken(token: string): { indent: SpotIndent, request: SpotVendorRequest, vendor: SpotVendor } | null {
        this.load();
        for (const indent of this.indents) {
            const req = indent.vendorRequests.find(r => r.token === token);
            if (req) {
                const vendor = this.vendors.find(v => v.id === req.vendorId);
                if (vendor) return { indent, request: req, vendor };
            }
        }
        return null;
    }

    // --- ACTIONS ---

    // 1. Create & Broadcast
    createIndent(data: { origin: string, destination: string, vehicleType: string, weightTon: number, benchmarkPrice: number, selectedVendorIds: string[] }): SpotIndent {
        const indentId = `IND-${Date.now().toString().slice(-6)}`;

        const newIndent: SpotIndent = {
            id: indentId,
            requestorId: 'USER-1',
            origin: data.origin,
            destination: data.destination,
            vehicleType: data.vehicleType as any,
            weightTon: data.weightTon,
            benchmarkPrice: data.benchmarkPrice,
            status: 'BIDDING', // Immediately Open
            vendorRequests: [],
            createdAt: new Date().toISOString()
        };

        // Create Requests for selected vendors
        newIndent.vendorRequests = data.selectedVendorIds.map(vId => {
            const token = `guest-${Math.random().toString(36).substring(7)}`; // Simple simulation token
            // Mock WhatsApp API Call
            console.log(`[WhatsApp API] To Vendor ${vId}: Output Load ${data.origin}-${data.destination}. Link: /guest-bid/${token}`);

            return {
                id: `REQ-${Math.random().toString(36).substring(7)}`,
                indentId: indentId,
                vendorId: vId,
                token: token,
                status: 'SENT',
                whatsappSent: true
            };
        });

        this.indents.unshift(newIndent);
        this.saveIndents();
        return newIndent;
    }

    // 2. Submit Bid (Guest)
    submitBid(token: string, amount: number, remarks: string): boolean {
        this.load();
        const match = this.getRequestByToken(token);
        if (!match) return false;

        const { indent, request } = match;

        // Create Bid
        const newBid: SpotBid = {
            id: `BID-${Date.now()}`,
            requestId: request.id,
            vendorName: match.vendor.name, // Denormalize
            amount: amount,
            remarks: remarks,
            bidTime: new Date().toISOString()
        };

        // Update Request
        request.status = 'BID_RECEIVED';
        request.bid = newBid;

        // Save
        this.saveIndents();
        return true;
    }

    // 3. Approve Booking
    approveBooking(indentId: string, bidId: string): { success: boolean, message: string, bookingRef?: string } {
        const indent = this.indents.find(i => i.id === indentId);
        if (!indent) return { success: false, message: 'Indent not found' };

        // Find the bid (nested in requests)
        let winningBid: SpotBid | undefined;
        let winningReq: SpotVendorRequest | undefined;

        for (const req of indent.vendorRequests) {
            if (req.bid && req.bid.id === bidId) {
                winningBid = req.bid;
                winningReq = req;
                break;
            }
        }

        if (!winningBid || !winningReq) return { success: false, message: 'Bid not found' };

        // Variance Check
        const variance = (winningBid.amount - indent.benchmarkPrice) / indent.benchmarkPrice;
        // Note: Using 15% threshold from PRD
        if (variance > 0.15) {
            // In a real app, this would trigger "Pending VP Approval" status
            // For this demo, we'll allow it but flag it
            console.warn(`[Variance Alert] Price is ${variance * 100}% higher than benchmark.`);
        }

        // Finalize
        indent.status = 'BOOKED';
        indent.winningBidId = winningBid.id;
        indent.approvedPrice = winningBid.amount;
        indent.spotBookingRef = `SPOT-${indent.id.split('-')[1]}-${Math.floor(Math.random() * 1000)}`;

        this.saveIndents();

        const winningVendor = this.vendors.find(v => v.id === winningReq!.vendorId);
        console.log(`[WhatsApp API] To Vendor ${winningVendor?.name}: Booking Confirmed! Ref: ${indent.spotBookingRef}`);

        return { success: true, bookingRef: indent.spotBookingRef, message: 'Booking Confirmed' };
    }
}

export const spotService = new SpotService();
