
export enum InvoiceStatus {
  PENDING = 'PENDING',
  OPS_APPROVED = 'OPS_APPROVED',       // Step 1 Complete (Lan)
  FINANCE_APPROVED = 'FINANCE_APPROVED', // Step 2 Complete (William)
  TREASURY_PENDING = 'TREASURY_PENDING', // Ready for Payment Run
  APPROVED = 'APPROVED', // Fully Approved (Legacy/Final)
  PAID = 'PAID',
  REJECTED = 'REJECTED',
  EXCEPTION = 'EXCEPTION',
  VENDOR_RESPONDED = 'VENDOR_RESPONDED'
}

export enum MatchStatus {
  MATCH = 'MATCH',
  MISMATCH = 'MISMATCH',
  MISSING = 'MISSING'
}

export type UserRole = 'HITACHI' | '3SC' | 'VENDOR';

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'VENDOR' | 'AUDITOR' | 'SYSTEM';
  content: string;
  timestamp: string;
  avatar?: string;
  isInternal?: boolean; // If true, hidden from Vendor
}

export interface Dispute {
  status: 'OPEN' | 'VENDOR_RESPONDED' | 'UNDER_REVIEW' | 'RESOLVED';
  ticketId?: string; // e.g. TKT-2025-001
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedTo?: string;
  messages: ChatMessage[]; // The Chat Log
  history: {
    actor: 'Vendor' | 'SCM' | 'System';
    timestamp: string;
    action: string;
    comment?: string;
  }[];
}

export interface WorkflowHistoryItem {
  stepId: string;
  status: 'PENDING' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'PROCESSING';
  approverName?: string;
  approverRole?: string;
  timestamp?: string;
  comment?: string;
}

export interface Notification {
  id: string;
  type: 'ASSIGNMENT' | 'ALERT' | 'INFO';
  message: string;
  timestamp: string;
  read: boolean;
  actionLink?: string;
}

export interface LogisticsDetails {
  vesselName: string;
  voyageNumber: string;
  billOfLading: string;
  containerNumber: string;
  containerType: '20GP' | '40HC' | '45HC' | 'LCL';
  weight: number;
  volume: number;
  portOfLoading: string;
  portOfDischarge: string;
  etd: string;
  eta: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  businessUnit?: string; // Added for Phase 6
  carrier: string;
  origin: string;
  destination: string;
  amount: number;
  currency: string;
  date: string;
  dueDate?: string;
  status: InvoiceStatus;
  variance: number;
  reason?: string;
  extractionConfidence: number;
  // Parcel Specific (FedEx/UPS/DHL)
  parcelDetails?: {
    serviceType: string; // e.g. "FedEx Priority Overnight"
    trackingNumber: string;
    zone: string;
    billedWeight: number;
    actualWeight: number;
    dimWeight: number;
    dimFactor: number; // e.g. 139
    dimensions: string; // "10x10x10"
    guaranteedDeliveryDate?: string;
    actualDeliveryDate?: string;
    isResidential: boolean;
    signedBy?: string;
  };

  lineItems: LineItem[];
  matchResults: {
    rate: MatchStatus;
    delivery: MatchStatus;
    unit: MatchStatus;
  };
  assignedTo?: string;
  currentStepId?: string;
  nextApproverRole?: string;

  // --- WORKFLOW ENGINE v2 ---
  workflowHistory?: WorkflowHistoryItem[];

  // --- SOLID FEATURES ---
  tmsEstimatedAmount?: number;
  auditAmount?: number;
  source?: 'EDI' | 'API' | 'EMAIL' | 'MANUAL' | 'PORTAL' | 'ERS';
  tmsMatchStatus?: 'LINKED' | 'NOT_FOUND';
  sapShipmentRef?: string;
  spotQuoteRef?: string;

  // Tax Compliance (Global)
  taxTotal?: number;
  taxDetails?: TaxDetail[];

  // FX & Multi-Currency
  baseAmount?: number;
  exchangeRate?: number;
  baseCurrency?: string;

  // Smart GL Splitter
  glSegments?: {
    code: string;
    segment: string;
    amount: number;
    percentage: number;
    color: string;
  }[];

  // Dispute Management
  dispute?: Dispute;

  // Logistics Context
  logistics?: LogisticsDetails;
  // Landed Cost
  skuList?: SKUItem[];
}

export interface SKUItem {
  id: string;
  name: string;
  quantity: number;
  weight: number; // kg
  volume: number; // cbm
  value: number; // USD
}

// Tax Compliance Types
export interface TaxDetail {
  type: string; // VAT, CGST, SGST, IGST, STATE_TAX
  rate: number;
  amount: number;
  jurisdiction?: string;
}

export interface LineItem {
  description: string;
  amount: number;
  expectedAmount: number;
}


export interface RateCard {
  id: string;
  carrier: string;
  contractRef: string;
  origin: string;
  destination: string;
  containerType: string;
  rate: number;
  currency: string;
  status: 'ACTIVE' | 'EXPIRED';
  validFrom: string;
  validTo: string;
}

export interface KPI {
  label: string;
  value: string;
  subtext: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'blue' | 'teal' | 'orange' | 'red';
}

export interface PaymentBatch {
  id: string;
  runDate: string;
  entity: string;
  bankAccount: string;
  currency: string;
  amount: number;
  invoiceCount: number;
  status: 'DRAFT' | 'AWAITING_APPROVAL' | 'APPROVED' | 'SENT_TO_BANK' | 'PAID' | 'REJECTED';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  nextApprover?: string;
  // Detail Fields
  invoiceIds: string[];
  paymentTerms: string;
  sanctionStatus: 'PASSED' | 'PENDING' | 'FAILED';
  discountAvailable?: number;
  fundingRequestId?: string; // Link to Weekly Funding
}

// --- RBAC & WORKFLOW ENGINE TYPES ---

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  users: number;
  permissions: {
    canViewInvoices: boolean;
    canApproveL1: boolean;
    canApproveL2: boolean;
    canManageRates: boolean;
    canAdminSystem: boolean;
  };
}

export interface WorkflowStepConfig {
  id: string;
  stepName: string;
  roleId: string;
  conditionType: 'ALWAYS' | 'AMOUNT_GT' | 'VARIANCE_GT';
  conditionValue?: number;
  isSystemStep?: boolean;
}

// --- PHASE 7: ADVANCED ANALYTICS ---

export interface CTSRecord {
  id: string;
  sku: string;
  customer: string;
  lane: string;
  totalCost: number;
  breakdown: {
    transport: number;
    accessorial: number;
    handling: number;
    overhead: number;
  };
  margin: number;
  units: number;
}

export interface CarrierScorecard {
  carrierId: string;
  carrierName: string;
  overallScore: number; // 0-100
  metrics: {
    onTimeDelivery: number;
    invoiceAccuracy: number;
    slaAdherence: number;
    rateConsistency: number;
    damageRatio: number;
  };
  trend: 'up' | 'down' | 'stable';
  rank: number;
}

export interface AnomalyRecord {
  id: string;
  shipmentId: string;
  type: 'FUEL_SURCHARGE' | 'WEIGHT_VARIANCE' | 'RATE_MISMATCH' | 'DUPLICATE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0-100 (Confidence)
  detectedAt: string;
  status: 'OPEN' | 'RESOLVED' | 'DISPUTED';
  description: string;
  value: number;
  expectedValue: number;
  carrierName?: string; // Added for Phase 13 Interconnectivity
}

// --- MODULE 1: DYNAMIC CONTRACT MASTER (INDIAN LOGISTICS) ---

export type VehicleType = 'Tata Ace' | '407' | '19ft' | '32ft SXL' | '32ft MXL' | '20ft SXL' | '40ft Trailer' | '10-Tyre' | 'Taurus';

export type RateBasis = 'Per Trip' | 'Per Kg' | 'Per Ton' | 'Per Km';

// Layer 4: Accessorial Rulebook
export interface AccessorialRules {
  loadingUnloading: {
    isIncluded: boolean;
    ratePerTon?: number;
    lumpSum?: number;
  };
  detention: {
    freeTimeLoading: number; // Hours
    freeTimeUnloading: number; // Hours
    ratePerDay: number;
    excludeHolidays: boolean;
  };
  oda: {
    distanceThreshold: number; // km
    surcharge: number;
  };
  tolls: {
    isInclusive: boolean; // If false, "At Actuals"
  };
}

// Layer 3: PVC Engine (Diesel Escalation)
export interface PVCConfig {
  baseDieselPrice: number;
  mileageBenchmark: number; // KMPL
  referenceCity: string;
}

// Layer 2: Freight Matrix Entry
export interface FreightRate {
  id: string;
  origin: string; // City or Zone
  destination: string; // City or Zone
  vehicleType: VehicleType;
  capacityTon: number;
  rateBasis: RateBasis;
  baseRate: number;
  minCharge?: number;
  transitTimeHrs: number;
}

// Layer 1: The Header
export interface Contract {
  id: string;
  vendorId: string;
  vendorName: string;
  serviceType: 'FTL' | 'LTL' | 'Express' | 'Air';
  validFrom: string;
  validTo: string;
  paymentTerms: 'Net 30' | 'Net 45' | 'Net 60' | 'Immediate';
  isRCMApplicable: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'PENDING_APPROVAL';

  // Layers
  freightMatrix: FreightRate[];
  pvcConfig: PVCConfig;
  accessorials: AccessorialRules;
}

// --- MODULE 2: SPOT-BUY ENGINE ---

export interface SpotVendor {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  rating: number; // 1-5 stars
}

export interface SpotBid {
  id: string;
  requestId: string; // Links to SpotVendorRequest
  vendorName: string; // Denormalized for display
  amount: number;
  remarks?: string;
  bidTime: string;
  isWinningBid?: boolean;
}

export interface SpotVendorRequest {
  id: string; // "SVR-..."
  indentId: string;
  vendorId: string;
  token: string; // The "Guest Link" token
  status: 'SENT' | 'OPENED' | 'BID_RECEIVED' | 'DECLINED';
  whatsappSent: boolean;
  bid?: SpotBid;
}

export interface SpotIndent {
  id: string; // "IND-..."
  requestorId: string;
  origin: string;
  destination: string;
  vehicleType: VehicleType;
  weightTon: number;

  benchmarkPrice: number; // From Contract Master

  status: 'OPEN' | 'BIDDING' | 'PENDING_APPROVAL' | 'BOOKED' | 'CANCELLED';

  vendorRequests: SpotVendorRequest[];

  approvedPrice?: number;
  winningBidId?: string;
  spotBookingRef?: string; // "SPOT-..."
  approvalProofUrl?: string; // For offline override

  createdAt: string;
}

// --- MODULE 3: VENDOR ONBOARDING LITE ---

export interface OnboardingVendor {
  id: string;
  mobile: string;
  email?: string;

  // Tax & Legal (Step 2)
  gstin: string;
  companyName: string; // Auto-fetched
  tradeName?: string;
  pan: string;
  legalStructure: 'Proprietorship' | 'Private Ltd' | 'Partnership' | 'LLP';
  address: string;

  // Bank (Step 3)
  bankAccount: string;
  ifsc: string;
  bankBeneficiaryName: string;
  isBankVerified: boolean;

  // Compliance (Step 4)
  isMsme: boolean;
  msmeRegNumber?: string;
  lowerDeductionCert?: boolean; // Sec 197

  // Finance Config (Auto-Computed)
  paymentTermsDays: number; // 45 (MSME) vs 60 (Std)
  tdsRate: number; // 1% (Prop) vs 2% (Pvt Ltd) or 0.5% (Cert)

  status: 'DRAFT' | 'COMPLETED' | 'APPROVED';
}

// --- MODULE 5: INDIA TAX ENGINE ---

export interface TaxBreakdown {
  // GST Components
  taxableAmount: number;
  gstRate: number; // 5, 12, 18
  cgst: number;
  sgst: number;
  igst: number;
  isRcm: boolean; // If true, Client pays tax to Govt
  gstPayableToVendor: number;
  gstPayableToGovt: number;

  // TDS Components
  tdsRate: number; // 1, 2, 0.5 (Lower Deduction)
  tdsAmount: number;
  sectionCode: '194C' | '194Q' | '194I';

  // Final Net Pay
  netPayableToVendor: number; // (Base + GST_Vendor) - TDS
}

export interface VendorTaxProfile {
  id: string;
  name: string;
  gstin: string;
  stateCode: string; // '27', '07'
  constitution: 'Proprietorship' | 'Company' | 'Partnership'; // Determines TDS 1% vs 2%
  isGta: boolean; // Goods Transport Agency
  isRcmOpted: boolean; // If GTA and yes, RCM applies (5%)
  defaultGstRate: number; // 5, 12, 18
  lowerDeductionCert?: {
    rate: number;
    validTo: string;
  };
}

// --- MODULE 6: THE BLACKBOOK SCORECARD ---

export interface VendorIncident {
  id: string;
  vendorId: string;
  date: string;
  type: 'PLACEMENT_FAILURE' | 'TRANSIT_DELAY' | 'POD_DELAY' | 'DAMAGE' | 'OTHER';
  severity: 1 | 2 | 3 | 4 | 5; // 5 = Critical
  remarks: string;
  costImpact?: number; // Estimated financial loss
  isForceMajeure?: boolean; // If true, excluded from score
}

export interface VendorScorecard {
  vendorId: string;
  vendorName: string;
  month: string; // "2025-01"

  // Raw Stats
  totalBookings: number;
  placementFailures: number;
  onTimeDeliveries: number;
  podDelays: number;

  // Scores (0-100)
  placementScore: number;
  speedScore: number;
  docScore: number;

  overallScore: number;
  rank: number;
  trend: 'UP' | 'DOWN' | 'STABLE';

  // Financial Impact (The "Killer Feature")
  costOfFailure: number;
}

// --- MODULE 4: BABU OCR ENGINE ---

export interface OCRAnalysisResult {
  fullText: string;
  detectedKeywords: string[]; // e.g. ["damage", "broken"]
  isClean: boolean;
  confidence: number;
  handwritingDetected: boolean;
}

export interface ShipmentDocument {
  id: string;
  type: 'INVOICE' | 'POD' | 'WEIGHT_SLIP' | 'EWAY_BILL' | 'UNKNOWN';
  pageNumber: number;
  imageUrl: string;

  // Extracted Data
  docDate?: string;
  docAmount?: number;
  docNumber?: string;

  // The "Babu" Analysis (POD Only)
  ocrResult?: OCRAnalysisResult;
  status: 'PROCESSING' | 'COMPLETED' | 'FLAGGED';
}

export interface ShipmentUpload {
  id: string;
  shipmentId: string; // Ref
  rawFileUrl: string; // The Multi-page PDF
  uploadedAt: string;
  splitDocuments: ShipmentDocument[];

  // Aggregate Status
  overallStatus: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'NEEDS_REVIEW';
  flaggedKeywords: string[]; // Union of all docs
}
