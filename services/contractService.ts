import { Contract, VehicleType, FreightRate } from '../types';

// --- SEED DATA (Indian Logistics Context) ---
const SEED_CONTRACTS: Contract[] = [
    {
        id: 'CON-2025-001',
        vendorId: 'V-101',
        vendorName: 'SafeExpress Logistics',
        serviceType: 'FTL',
        validFrom: '2025-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 45',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-001', origin: 'Mumbai', destination: 'Delhi', vehicleType: '32ft MXL', capacityTon: 15, rateBasis: 'Per Trip', baseRate: 40000, transitTimeHrs: 72 },
            { id: 'fr-002', origin: 'Mumbai', destination: 'Bangalore', vehicleType: '32ft MXL', capacityTon: 15, rateBasis: 'Per Trip', baseRate: 35000, transitTimeHrs: 48 },
            { id: 'fr-003', origin: 'Pune', destination: 'Chennai', vehicleType: '10-Tyre', capacityTon: 16, rateBasis: 'Per Trip', baseRate: 42000, transitTimeHrs: 60 }
        ],
        pvcConfig: { baseDieselPrice: 90.00, mileageBenchmark: 4.0, referenceCity: 'IOCL Mumbai Rate' },
        accessorials: { loadingUnloading: { isIncluded: true }, detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 1500, excludeHolidays: true }, oda: { distanceThreshold: 50, surcharge: 2000 }, tolls: { isInclusive: false } }
    },
    {
        id: 'CON-2025-002',
        vendorId: 'V-102',
        vendorName: 'VRL Logistics',
        serviceType: 'LTL',
        validFrom: '2025-02-01',
        validTo: '2026-01-31',
        paymentTerms: 'Net 30',
        isRCMApplicable: false,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-004', origin: 'Delhi', destination: 'Kolkata', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 6.5, minCharge: 1500, transitTimeHrs: 56 }
        ],
        pvcConfig: { baseDieselPrice: 92.00, mileageBenchmark: 6.5, referenceCity: 'Delhi' },
        accessorials: { loadingUnloading: { isIncluded: false, ratePerTon: 200 }, detention: { freeTimeLoading: 12, freeTimeUnloading: 12, ratePerDay: 1000, excludeHolidays: false }, oda: { distanceThreshold: 25, surcharge: 500 }, tolls: { isInclusive: true } }
    },
    {
        id: 'CON-2025-003',
        vendorId: 'V-103',
        vendorName: 'TCI Freight',
        serviceType: 'FTL',
        validFrom: '2025-03-01',
        validTo: '2026-02-28',
        paymentTerms: 'Net 60',
        isRCMApplicable: true,
        status: 'PENDING_APPROVAL',
        freightMatrix: [],
        pvcConfig: { baseDieselPrice: 89.50, mileageBenchmark: 3.5, referenceCity: 'Chennai' },
        accessorials: { loadingUnloading: { isIncluded: true }, detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 2500, excludeHolidays: true }, oda: { distanceThreshold: 50, surcharge: 2500 }, tolls: { isInclusive: false } }
    }
];

// --- SERVICE CLASS ---
class ContractService {
    private STORAGE_KEY = 'contracts_v1';
    private contracts: Contract[] = [];

    constructor() {
        this.load();
    }

    private load() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            this.contracts = JSON.parse(stored);
        } else {
            this.contracts = SEED_CONTRACTS;
            this.save();
        }
    }

    private save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.contracts));
    }

    getAll(): Contract[] {
        this.load(); // Reload to ensure sync
        return this.contracts;
    }

    getById(id: string): Contract | undefined {
        return this.contracts.find(c => c.id === id);
    }

    add(contract: Contract) {
        this.contracts.unshift(contract);
        this.save();
    }

    update(contract: Contract) {
        const idx = this.contracts.findIndex(c => c.id === contract.id);
        if (idx !== -1) {
            this.contracts[idx] = contract;
            this.save();
        }
    }

    reset() {
        this.contracts = SEED_CONTRACTS;
        this.save();
    }

    // --- LOGIC ENGINE ---
    calculateFreight(params: any): any {
        // Need to fetch fresh data
        const contract = this.getById(params.contractId);
        if (!contract) {
            return { totalCost: 0, baseFreight: 0, fuelSurcharge: 0, breakdown: [], isError: true, errorMessage: 'Contract not found' };
        }

        const rateEntry = contract.freightMatrix.find(
            r => r.origin.toLowerCase() === params.origin.toLowerCase() &&
                r.destination.toLowerCase() === params.destination.toLowerCase() &&
                r.vehicleType === params.vehicleType
        );

        if (!rateEntry) {
            return { totalCost: 0, baseFreight: 0, fuelSurcharge: 0, breakdown: [], isError: true, errorMessage: `No rate found for ${params.origin} to ${params.destination} (${params.vehicleType})` };
        }

        let baseFreight = 0;
        if (rateEntry.rateBasis === 'Per Trip') {
            baseFreight = rateEntry.baseRate;
        } else if (rateEntry.rateBasis === 'Per Kg') {
            baseFreight = rateEntry.baseRate * (params.weight || 1000); // Default 1000kg if missing
            if (rateEntry.minCharge && baseFreight < rateEntry.minCharge) {
                baseFreight = rateEntry.minCharge;
            }
        }
        // TODO: Other basis

        const { baseDieselPrice, mileageBenchmark } = contract.pvcConfig;
        const priceDiff = params.currentDieselPrice - baseDieselPrice;

        let fuelSurcharge = 0;
        if (priceDiff > 0) {
            fuelSurcharge = (priceDiff / mileageBenchmark) * params.distanceKm;
        }

        const totalCost = baseFreight + fuelSurcharge;

        return {
            totalCost,
            baseFreight,
            fuelSurcharge,
            breakdown: [
                `Base Freight (${rateEntry.rateBasis}): ₹${baseFreight.toLocaleString()}`,
                `PVC Surcharge: ₹${fuelSurcharge.toLocaleString(undefined, { maximumFractionDigits: 0 })} ((${params.currentDieselPrice} - ${baseDieselPrice}) / ${mileageBenchmark} * ${params.distanceKm}km)`,
                `Total Estimated: ₹${totalCost.toLocaleString()}`
            ],
            isError: false
        };
    }
}

export const contractService = new ContractService();
