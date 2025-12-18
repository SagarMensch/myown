

import React, { useState } from 'react';
import { Invoice, InvoiceStatus, RoleDefinition, WorkflowStepConfig, WorkflowHistoryItem } from '../types';
import {
  ArrowLeft, CheckCircle, XCircle, X, Check, Printer, Download,
  ShieldCheck, AlertTriangle, FileText, DollarSign,
  AlertCircle, Clock, Link as LinkIcon, Box, PieChart, Lock,
  MessageSquare, User, Building2, Cpu, Edit2, Ship, Anchor, Container,
  HelpCircle, FileText as FileIcon, Eye, BookOpen, GitMerge, Calculator,
  ScanSearch, TrendingDown, Coins, Award, Target, FileCheck, Truck, Leaf, Link as LinkIcon2, Landmark
} from 'lucide-react';
import { generateAuditTrailPDF } from '../utils/reportGenerator';
import { Button } from '../components/Button';
import { checkClaimsStatus } from '../services/claimsService';
import { Card } from '../components/Card';
import { generateGLAllocation } from '../services/glCodingService';
import { calculateLandedCost } from '../services/landedCostService';
import { verifySpotMatch } from '../services/spotQuoteService';
import { validateTaxCompliance, taxService } from '../services/taxService';
import { benchmarkRate } from '../services/benchmarkingService';
import { calculateEarlyPaymentOffer } from '../services/earlyPaymentService';
import { performThreeWayMatch } from '../services/threeWayMatchService';
import { calculateCarbon } from '../services/carbonService';
import { getCarrierScorecard, getScoreColor } from '../services/carrierScorecardService';
import { analyzeParcelInvoice } from '../services/parcelAuditService';
import { DisputeChat } from '../components/DisputeChat';



interface InvoiceDetailProps {
  invoice: Invoice;
  onBack: () => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  activePersona: { id: string; role: string; name: string, roleId: string };
  roles: RoleDefinition[];
  workflowConfig: WorkflowStepConfig[];
  onWorkflowDecision: (invoiceId: string, stepId: string, decision: 'APPROVE' | 'REJECT', comment: string) => void;
}

export const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoice, onBack, onUpdateInvoice, activePersona, roles, workflowConfig, onWorkflowDecision }) => {
  const taxCheck = validateTaxCompliance(invoice);
  const glData = generateGLAllocation(invoice);
  const marketBench = benchmarkRate(invoice.origin || '', invoice.destination || '', 'OCEAN', invoice.baseAmount || invoice.amount, 1);
  const scorecard = getCarrierScorecard(invoice.carrier);
  const threeWay = performThreeWayMatch(invoice);
  const carbon = calculateCarbon(invoice);

  const claimsData = checkClaimsStatus(invoice);
  const parcelAudit = analyzeParcelInvoice(invoice);

  // INDIA TAX ENGINE
  const taxBreakdown = taxService.calculateTax(invoice.baseAmount || invoice.amount, invoice.carrier);

  // Landed Cost Calc
  const landedCosts = invoice.skuList ? calculateLandedCost(invoice.baseAmount || invoice.amount, invoice.skuList, 'Air') : [];

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [reasonCode, setReasonCode] = useState('');
  const [comment, setComment] = useState('');

  const finalizeStatus = (newStatus: InvoiceStatus) => {
    onUpdateInvoice({ ...invoice, status: newStatus });
  };

  const handleDecision = (stepId: string, decision: 'APPROVE' | 'REJECT') => {
    onWorkflowDecision(invoice.id, stepId, decision, comment);
    setComment(''); // Clear comment after submission
  };

  const handleRequestInfo = () => {
    // In a real app, this would trigger a query workflow
    console.log(`Query sent to ${invoice.carrier} regarding Invoice #${invoice.invoiceNumber}. Status updated to 'PENDING INFO'.`);
  };

  const handleDownloadAudit = () => {
    // Use the existing report generator but tailored for single invoice audit
    generateAuditTrailPDF(invoice);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderStandardDetail = () => {
    return (
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: The Evidence (PDF) */}
        <div className="w-1/2 bg-slate-800 flex flex-col overflow-hidden relative border-r border-slate-700">
          <div className="h-12 bg-slate-900 flex items-center justify-between px-4 text-slate-400 border-b border-slate-700 flex-shrink-0 shadow-md z-10">
            <div className="flex items-center space-x-3">
              <FileIcon size={14} className="text-teal-500" />
              <span className="text-xs font-medium text-slate-300">invoice_{invoice.invoiceNumber}.pdf</span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">1/1</span>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleDownloadAudit} className="hover:text-white transition-colors" title="Download Audit Trail"><Download size={16} /></button>
              <button onClick={handlePrint} className="hover:text-white transition-colors" title="Print Invoice"><Printer size={16} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
            <div className="bg-white shadow-lg w-full max-w-[595px] min-h-[842px] p-10 text-xs font-mono text-gray-800 relative">
              <div className="absolute top-10 right-10 border-4 border-red-600 text-red-600 font-bold text-xl px-4 py-2 opacity-30 transform -rotate-12 pointer-events-none">
                RECEIVED
              </div>
              <div className="flex justify-between border-b-2 border-black pb-4 mb-8">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight mb-1">{invoice.carrier.toUpperCase()}</h1>
                  <p>Global Logistics Services</p>
                  <p>100 Shipping Way, Copenhagen</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold">INVOICE</h2>
                  <p>Inv #: {invoice.invoiceNumber}</p>
                  <p>Date: {invoice.date}</p>
                </div>
              </div>
              <div className="mb-8">
                <p className="font-bold text-gray-600 mb-1">BILL TO:</p>
                <p className="font-bold text-sm">Hitachi Energy USA Inc.</p>
                <p>901 Main Campus Drive</p>
                <p>Raleigh, NC 27606</p>
              </div>
              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">₹{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mb-12">
                <div className="w-48">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span>₹{invoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black">
                    <span>Tax:</span>
                    <div className="text-right">
                      <span>₹{(invoice.taxTotal || 0).toFixed(2)}</span>
                      {invoice.taxDetails && invoice.taxDetails.map((t, idx) => (
                        <div key={idx} className="text-[10px] text-gray-500 italic">{t.type} @ {(t.rate * 100).toFixed(1)}%</div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-sm">
                    <span>TOTAL:</span>
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.amount)} {invoice.currency}</span>
                  </div>
                  {invoice.currency !== 'USD' && (
                    <div className="text-[10px] text-right text-gray-400 mt-1">
                      *Settlement in {invoice.baseCurrency || 'USD'}: ₹{(invoice.baseAmount || 0).toFixed(2)} (Exch Rate: {invoice.exchangeRate})
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center text-gray-400 text-[10px] mt-auto">
                <p>Thank you for your business.</p>
                <p>Terms: Net 45 Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Digitized Data & Audit */}
        <div className="w-1/2 bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="px-8 py-6 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 flex items-center">
              <FileText size={18} className="mr-2 text-teal-600" />
              Smart Audit & Match
            </h2>
            <div className="flex items-center mt-2 space-x-4">
              <p className="text-sm text-slate-500">AI Confidence: <span className="text-teal-600 font-bold">{invoice.extractionConfidence}%</span></p>
              <span className="text-slate-300">|</span>
              <p className="text-sm text-slate-500 flex items-center">
                Tax Check:
                <span className={`font-bold ml-1 flex items-center ${taxCheck.isValid ? 'text-teal-600' : 'text-red-500'}`}>
                  {taxCheck.isValid ? <CheckCircle size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
                  {taxCheck.isValid ? 'Global Pass' : 'Compliance Risk'}
                </span>
              </p>
              <span className="text-slate-300">|</span>
              <p className="text-sm text-slate-500">Match Status: <span className={`font-bold ${invoice.variance > 0 ? 'text-red-600' : 'text-teal-600'}`}>{invoice.variance > 0 ? 'Discrepancy' : 'Perfect'}</span></p>
            </div>
          </div>
          <div className="p-8 space-y-8">
            {/* AI INSIGHTS PANEL */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Cpu size={64} className="text-purple-600" />
              </div>
              <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center relative z-10">
                <Cpu size={14} className="mr-2" /> AI Insights
              </h4>
              <p className="text-sm text-gray-700 relative z-10 leading-relaxed">
                {invoice.variance >
                  0 ? `Detected a ₹${invoice.variance.toFixed(2)} discrepancy. The billed amount exceeds the contract rate. This appears to be due to unapproved accessorial charges or a rate index mismatch.`
                  : "Invoice matches the contracted rate card (Contract #GB01/0010). No anomalies detected in weight or volume calculations."}
              </p>
            </div>
            {/* Smart GL Splitter */}
            <div className="bg-white border text-[10px] sm:text-xs border-indigo-100 rounded p-4 mb-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <GitMerge size={64} className="text-indigo-600" />
              </div>
              <h3 className="font-bold text-indigo-900 mb-3 flex items-center">
                <GitMerge size={14} className="mr-2" /> Automated GL Coding
              </h3>
              {glData.map((seg, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-slate-600">{seg.segment} ({seg.code})</span>
                    <span className="font-bold text-slate-800">{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(seg.amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${seg.color}`} style={{ width: `${seg.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            {invoice.dispute && (
              <div className="mb-6">
                <DisputeChat
                  invoice={invoice}
                  onUpdateInvoice={onUpdateInvoice}
                  currentUser={{
                    name: activePersona.name,
                    role: activePersona.role === 'VENDOR' ? 'VENDOR' : 'AUDITOR'
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                <p className="text-xs text-gray-400 uppercase font-bold">Vendor Name</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{invoice.carrier}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                <p className="text-xs text-gray-400 uppercase font-bold">Invoice Number</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{invoice.invoiceNumber}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                <p className="text-xs text-gray-400 uppercase font-bold">Total Amount</p>
                <p className="text-sm font-bold text-gray-900 mt-1">₹{invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                <p className="text-xs text-gray-400 uppercase font-bold">Invoice Date</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{invoice.date}</p>
              </div>
            </div>

            {/* INDIA TAX ENGINE WIDGET */}
            <div className="bg-white border-2 border-dashed border-teal-200 rounded-lg p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Landmark size={80} className="text-teal-600" />
              </div>
              <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-4 flex items-center relative z-10">
                <Landmark size={16} className="mr-2" /> India Tax Engine (GST + TDS)
              </h3>

              <div className="space-y-3 relative z-10 text-sm">

                {/* 1. Base */}
                <div className="flex justify-between items-center text-gray-600">
                  <span>Base Freight</span>
                  <span className="font-mono">₹{taxBreakdown.taxableAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* 2. GST */}
                {taxBreakdown.isRcm ? (
                  <div className="flex justify-between items-center text-orange-600 bg-orange-50 p-2 rounded">
                    <span className="flex items-center text-xs font-bold"><AlertTriangle size={12} className="mr-1" /> (+) GST (RCM {taxBreakdown.gstRate}%)</span>
                    <span className="font-mono font-bold">₹{taxBreakdown.gstPayableToGovt.toLocaleString()} [Pay to Govt]</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="text-xs">(+) GST (FCM {taxBreakdown.gstRate}%)</span>
                    <span className="font-mono">₹{taxBreakdown.gstPayableToVendor.toLocaleString()}</span>
                  </div>
                )}

                {/* 3. TDS */}
                <div className="flex justify-between items-center text-red-600">
                  <span className="flex items-center text-xs"><TrendingDown size={12} className="mr-1" /> (-) TDS ({taxBreakdown.tdsRate}%)</span>
                  <span className="font-mono font-bold">₹{taxBreakdown.tdsAmount.toLocaleString()}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-teal-100 my-2"></div>

                {/* 4. NET PAYABLE */}
                <div className="flex justify-between items-center text-teal-900">
                  <span className="font-bold">Net Transfer to Vendor</span>
                  <span className="font-mono text-xl font-bold">₹{taxBreakdown.netPayableToVendor.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Context Tags */}
              <div className="mt-4 flex space-x-2">
                {taxBreakdown.isRcm && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">RCM APPLICABLE</span>}
                {taxBreakdown.tdsRate < 1 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">LOWER DEDUCTION CERT</span>}
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Sec {taxBreakdown.sectionCode}</span>
              </div>
            </div>

            {/* PARCEL AUDIT WIDGET */}
            {invoice.parcelDetails && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-6">
                <div className="bg-orange-50/50 px-4 py-3 border-b border-orange-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-orange-900 flex items-center">
                    <Box size={16} className="mr-2 text-orange-600" /> Parcel Audit (Small Package)
                  </h3>
                  {parcelAudit.scanStatus === 'CLEAN' ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center"><Check size={12} className="mr-1" /> Audit Passed</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center"><AlertTriangle size={12} className="mr-1" /> Refund Opportunities</span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-end mb-4 border-b border-orange-100 pb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Potential Savings</p>
                      <p className="text-3xl font-bold text-gray-900">₹{parcelAudit.potentialRefund.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Carrier Service</p>
                      <p className="text-sm font-bold text-gray-800">{invoice.parcelDetails.serviceType}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{invoice.parcelDetails.trackingNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* LSR / Late Delivery */}
                    <div className={`p-3 rounded border ${!parcelAudit.checks.gsr.valid ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase text-gray-600">Late Delivery (GSR)</span>
                        {!parcelAudit.checks.gsr.valid && <span className="text-xs font-bold text-red-600">+₹{parcelAudit.checks.gsr.savings}</span>}
                      </div>
                      <p className="text-xs text-gray-700 leading-snug">{parcelAudit.checks.gsr.details}</p>
                    </div>

                    {/* Dim Weight */}
                    <div className={`p-3 rounded border ${!parcelAudit.checks.dimWeight.valid ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase text-gray-600">Dim Weight Audit</span>
                        {!parcelAudit.checks.dimWeight.valid && <span className="text-xs font-bold text-red-600">+₹{parcelAudit.checks.dimWeight.savings}</span>}
                      </div>
                      <p className="text-xs text-gray-700 leading-snug">{parcelAudit.checks.dimWeight.details}</p>
                      <div className="mt-2 text-[10px] text-gray-400 flex space-x-2">
                        <span>Billed: {invoice.parcelDetails.billedWeight}lb</span>
                        <span>Dim: {invoice.parcelDetails.dimWeight}lb</span>
                      </div>
                    </div>

                    {/* Residential Check */}
                    <div className={`p-3 rounded border ${!parcelAudit.checks.residential.valid ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase text-gray-600">Resi Surcharge</span>
                        {!parcelAudit.checks.residential.valid && <span className="text-xs font-bold text-red-600">+₹{parcelAudit.checks.residential.savings}</span>}
                      </div>
                      <p className="text-xs text-gray-700 leading-snug">{parcelAudit.checks.residential.details}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3-WAY MATCH AUTOMATION */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-6">
              <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center">
                  <LinkIcon2 size={16} className="mr-2 text-indigo-600" /> 3-Way Match Automation
                </h3>
                {threeWay.isMatch ? (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 font-bold uppercase flex items-center">
                    <CheckCircle size={10} className="mr-1" /> Reconciled
                  </span>
                ) : (
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-bold uppercase flex items-center">
                    <AlertTriangle size={10} className="mr-1" /> Discrepancy
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between relative">
                  {/* Connector Line */}
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
                  <div className={`absolute top-1/2 left-0 h-0.5 -z-10 transition-all duration-1000 ${threeWay.isMatch ? 'bg-green-500 w-full' : 'bg-red-400 w-2/3'}`}></div>

                  {/* Documents */}
                  {threeWay.documents.map((doc, i) => (
                    <div key={doc.type} className="flex flex-col items-center bg-white px-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${doc.status === 'MATCHED' ? 'border-green-500 bg-green-50 text-green-600' : 'border-red-500 bg-red-50 text-red-600'}`}>
                        {doc.type === 'INVOICE' && <FileText size={18} />}
                        {doc.type === 'SHIPMENT_ORDER' && <FileCheck size={18} />}
                        {doc.type === 'POD' && <Truck size={18} />}
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{doc.type}</p>
                      <p className="text-xs font-bold text-slate-800">{doc.reference}</p>
                      {doc.status === 'MISMATCH' && <p className="text-[9px] text-red-500 font-bold mt-1">{doc.details}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SMART MATCH SIDE-BY-SIDE */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-600 flex items-center">
                  <ShieldCheck size={16} className="mr-2 text-teal-600" /> Smart Match Analysis
                </h3>
                {invoice.tmsMatchStatus === 'NOT_FOUND' && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200 font-bold uppercase flex items-center">
                    <AlertTriangle size={10} className="mr-1" /> Ghost Shipment
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 text-sm">
                {/* Header Row */}
                <div className="col-span-1 bg-gray-50/50 p-3 border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase">Line Item</div>
                <div className="col-span-1 bg-blue-50/30 p-3 border-b border-gray-100 font-bold text-blue-800 text-[10px] uppercase text-right">Invoice Billed</div>
                <div className="col-span-1 bg-teal-50/30 p-3 border-b border-gray-100 font-bold text-teal-800 text-[10px] uppercase text-right">System Expected</div>

                {/* Rows */}
                {invoice.lineItems.map((item, idx) => {
                  const variance = item.amount - item.expectedAmount;
                  const hasVariance = Math.abs(variance) > 0.01;

                  return (
                    <React.Fragment key={idx}>
                      <div className="col-span-1 p-3 border-b border-gray-50 font-medium text-gray-700 flex items-center">
                        {item.description}
                      </div>
                      <div className={`col-span-1 p-3 border-b border-gray-50 text-right font-mono ${hasVariance ? 'bg-red-50 text-red-700 font-bold' : 'text-gray-600'}`}>
                        ₹{item.amount.toFixed(2)}
                      </div>
                      <div className="col-span-1 p-3 border-b border-gray-50 text-right font-mono text-teal-700 font-bold bg-teal-50/10">
                        ₹{item.expectedAmount.toFixed(2)}
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Total Row */}
                <div className="col-span-1 p-3 bg-gray-50 font-bold text-gray-800 text-xs uppercase">Total</div>
                <div className={`col-span-1 p-3 bg-gray-50 text-right font-mono font-bold ${invoice.variance > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  ₹{invoice.amount.toFixed(2)}
                </div>
                <div className="col-span-1 p-3 bg-gray-50 text-right font-mono font-bold text-teal-700">
                  ₹{(invoice.auditAmount || invoice.amount).toFixed(2)}
                </div>
              </div>
            </div>

            {/* AUDIT METHODOLOGY PANEL (Phase 6) */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <BookOpen size={14} className="mr-2 text-blue-600" /> Audit Methodology
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-sm border border-gray-100">
                  <p className="font-bold text-gray-700 mb-1">Rate Card Logic</p>
                  <p className="text-gray-500">Matched against <span className="font-mono font-bold text-blue-600">RC-2025-GLOBAL-01</span>. Base rate validated for 40HC container from CNSHA to USNYC.</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-sm border border-gray-100">
                  <p className="font-bold text-gray-700 mb-1">Accessorials</p>
                  <p className="text-gray-500">Fuel Surcharge (BAF) calculated using <span className="font-mono font-bold text-blue-600">DOE Weekly Index</span> (Nov Week 4).</p>
                </div>
              </div>
            </div>

            {invoice.glSegments && (
              <div className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                    <PieChart size={14} className="mr-2" /> GL Coding & Business Unit
                  </h3>
                  <div className="flex space-x-2">
                    <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      BU: {invoice.businessUnit || 'Power Grids'}
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 flex items-center">
                      <Cpu size={10} className="mr-1" /> AI Suggested
                    </span>
                  </div>
                </div>
                <div className="flex w-full h-4 rounded overflow-hidden my-4 shadow-inner bg-gray-100">
                  {invoice.glSegments.map(seg => (
                    <div
                      key={seg.code}
                      style={{ width: `${seg.percentage}%` }}
                      className={`${seg.color}`}
                      title={`${seg.segment}: ${seg.percentage}%`}
                    ></div>
                  ))}
                </div>
                <ul className="space-y-2 text-xs">
                  {invoice.glSegments.map(seg => (
                    <li key={seg.code} className="flex justify-between items-center p-2 bg-gray-50 rounded-sm">
                      <div className="flex items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mr-2 ${seg.color}`}></span>
                        <span className="font-bold text-gray-800">{seg.segment}</span>
                        <span className="text-gray-500 ml-2 font-mono">{seg.code}</span>
                      </div>
                      <div className="font-mono text-gray-900 font-bold">
                        ₹{seg.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-gray-400 font-sans font-normal ml-1">({seg.percentage}%)</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-100 text-right">
                  <button className="flex items-center ml-auto px-3 py-1.5 rounded-sm text-xs font-bold uppercase border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    <Edit2 size={12} className="mr-2" /> Override Split
                  </button>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2 flex items-center">
                Approval Workflow
              </h4>

              {/* HORIZONTAL STEPPER */}
              <div className="relative flex justify-between items-start mb-8 px-2">
                {/* Progress Bar Background */}
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-100 -z-10"></div>

                {/* Progress Bar Active */}
                <div className="absolute top-3 left-0 h-0.5 bg-teal-500 -z-10 transition-all duration-500" style={{ width: `${(invoice.workflowHistory?.filter(h => h.status === 'APPROVED').length || 0) / (workflowConfig.length - 1) * 100}%` }}></div>

                {workflowConfig.map((step, idx) => {
                  const historyStep = invoice.workflowHistory?.find(h => h.stepId === step.id);
                  const status = historyStep?.status || 'PENDING';
                  const isCompleted = status === 'APPROVED';
                  const isActive = status === 'ACTIVE';
                  const isRejected = status === 'REJECTED';
                  const isSkipped = status === 'SKIPPED';

                  return (
                    <div key={step.id} className="flex flex-col items-center relative group">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300
                               ${isCompleted ? 'bg-teal-600 border-teal-600 text-white shadow-md scale-110' :
                          isActive ? 'bg-white border-blue-500 text-blue-600 shadow-lg ring-4 ring-blue-50 scale-110' :
                            isRejected ? 'bg-red-600 border-red-600 text-white' :
                              isSkipped ? 'bg-gray-100 border-gray-300 text-gray-400' :
                                'bg-white border-gray-200 text-gray-300'}
                            `}>
                        {isCompleted ? <Check size={14} strokeWidth={3} /> :
                          isRejected ? <X size={14} strokeWidth={3} /> :
                            isActive ? <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" /> :
                              isSkipped ? <div className="w-2 h-0.5 bg-gray-400" /> :
                                <span className="text-[10px] font-bold">{idx + 1}</span>}
                      </div>

                      <div className="mt-3 text-center">
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
                          {step.stepName}
                        </p>
                        <p className="text-[10px] text-gray-400 max-w-[80px] leading-tight mx-auto">
                          {historyStep?.approverRole || roles.find(r => r.id === step.roleId)?.name}
                        </p>
                      </div>

                      {/* HOVER DETAILS CARD */}
                      <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-48 bg-gray-900 text-white text-xs p-3 rounded shadow-xl arrow-bottom">
                        <p className="font-bold mb-1">{step.stepName}</p>
                        <p className="text-gray-300 mb-2">Status: <span className="text-white font-bold">{status}</span></p>
                        {historyStep?.comment && (
                          <div className="bg-gray-800 p-2 rounded italic text-gray-300 border-l-2 border-gray-500">
                            "{historyStep.comment}"
                          </div>
                        )}
                        {historyStep?.timestamp && <p className="text-[10px] text-gray-500 mt-2">{historyStep.timestamp}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ACTIVE STEP ACTION CARD */}
              {invoice.workflowHistory?.map(historyStep => {
                const stepConfig = workflowConfig.find(c => c.id === historyStep.stepId);
                if (!stepConfig || historyStep.status !== 'ACTIVE') return null;

                const userCanAct = activePersona.roleId === stepConfig.roleId || roles.find(r => r.id === activePersona.roleId)?.permissions.canAdminSystem;

                if (!userCanAct) return (
                  <div key="locked-msg" className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-center text-blue-800 text-sm font-medium animate-fadeIn">
                    <Clock size={16} className="mr-2 animate-spin-slow" />
                    Waiting for {roles.find(r => r.id === stepConfig.roleId)?.name} to approve...
                  </div>
                );

                return (
                  <div key="action-card" className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-lg p-6 shadow-md ring-1 ring-blue-100 animate-slideUp relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-bl-full -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-center mb-5 relative z-10">
                      <h5 className="text-lg font-bold text-slate-800 flex items-center">
                        <Edit2 size={18} className="mr-3 text-blue-600" />
                        Action Required
                      </h5>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                        {stepConfig.stepName}
                      </span>
                    </div>
                    <textarea
                      className="w-full text-sm p-3 border border-gray-300 rounded-md mb-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Enter your approval comments or rejection reason..."
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleDecision(stepConfig.id, 'APPROVE')}
                        className="flex-1 bg-teal-600 text-white text-sm font-bold py-2.5 rounded hover:bg-teal-700 transition-all shadow-sm flex items-center justify-center"
                      >
                        <CheckCircle size={16} className="mr-2" /> Approve Invoice
                      </button>
                      <button
                        onClick={() => handleDecision(stepConfig.id, 'REJECT')}
                        className="flex-1 bg-white border border-red-200 text-red-600 text-sm font-bold py-2.5 rounded hover:bg-red-50 transition-all flex items-center justify-center"
                      >
                        <XCircle size={16} className="mr-2" /> Reject
                      </button>
                      <button
                        onClick={handleRequestInfo}
                        className="flex-1 bg-white border border-gray-300 text-gray-600 text-sm font-bold py-2.5 rounded hover:bg-gray-50 transition-all flex items-center justify-center"
                        title="Request more information from vendor or internal team"
                      >
                        <HelpCircle size={16} className="mr-2" /> Request Info
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div >
      </div >
    );
  };

  return (
    <div className="h-full flex flex-col font-sans bg-slate-100 overflow-hidden relative">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 shadow-lg z-20 flex-shrink-0 text-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white tracking-tight">Invoice #{invoice.invoiceNumber}</h2>
                {invoice.status === InvoiceStatus.APPROVED && <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-2 py-0.5 rounded border border-teal-500/30">APPROVED</span>}
                {invoice.status === InvoiceStatus.EXCEPTION && <span className="bg-red-500/20 text-red-300 text-xs font-bold px-2 py-0.5 rounded border border-red-500/30">EXCEPTION</span>}
                {invoice.status === InvoiceStatus.REJECTED && <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded border border-slate-600">REJECTED</span>}
                {invoice.status === InvoiceStatus.VENDOR_RESPONDED && <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2 py-0.5 rounded border border-blue-500/30">VENDOR RESPONDED</span>}
              </div>
              <p className="text-sm text-slate-400 mt-1 font-medium">{invoice.carrier} • {invoice.origin} <span className="text-slate-600 mx-1">→</span> {invoice.destination}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right mr-2">
              <p className="text-xs text-slate-500 font-bold uppercase">Total Amount</p>
              <p className="text-2xl font-bold text-white tracking-tight">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}
              </p>
              {invoice.currency !== 'USD' && invoice.baseAmount && (
                <p className="text-xs text-teal-400 font-mono mt-0.5 flex justify-end items-center">
                  <span className="opacity-70 mr-1">USD Eqv:</span>
                  ₹{invoice.baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span className="text-[9px] text-slate-500 ml-1 border border-slate-700 px-1 rounded bg-slate-800">
                    @ {invoice.exchangeRate}
                  </span>
                </p>
              )}
            </div>
            {invoice.status === InvoiceStatus.EXCEPTION && (
              <Button
                onClick={() => setShowUnlockModal(true)}
                variant="danger"
                size="sm"
                icon={ShieldCheck}
              >
                Force Approve
              </Button>
            )}
            <Button
              onClick={handleDownloadAudit}
              variant="secondary"
              size="sm"
              icon={FileIcon}
              className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Audit Trail
            </Button>
          </div>
        </div>

        {/* LOGISTICS CONTEXT BAR */}
        {invoice.logistics && (
          <div className="flex items-center space-x-8 pt-4 border-t border-slate-800/50">
            <div className="flex items-center text-xs group cursor-help">
              <Ship size={16} className="text-blue-400 mr-2 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Vessel / Voyage</p>
                <p className="font-bold text-slate-300">{invoice.logistics.vesselName} <span className="text-slate-500">({invoice.logistics.voyageNumber})</span></p>
              </div>
            </div>
            <div className="flex items-center text-xs group cursor-help">
              <FileText size={16} className="text-teal-400 mr-2 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Bill of Lading</p>
                <p className="font-bold text-slate-300 font-mono">{invoice.logistics.billOfLading}</p>
              </div>
            </div>
            <div className="flex items-center text-xs group cursor-help">
              <Container size={16} className="text-orange-400 mr-2 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Container</p>
                <p className="font-bold text-slate-300 font-mono">{invoice.logistics.containerNumber} <span className="bg-slate-800 text-slate-400 px-1 rounded ml-1 border border-slate-700">{invoice.logistics.containerType}</span></p>
              </div>
            </div>
            <div className="flex items-center text-xs group cursor-help">
              <Anchor size={16} className="text-purple-400 mr-2 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Port Pair</p>
                <p className="font-bold text-slate-300">{invoice.logistics.portOfLoading} <span className="text-slate-600">→</span> {invoice.logistics.portOfDischarge}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {renderStandardDetail()}

      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-sm shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50 flex items-center text-red-700">
              <AlertTriangle size={20} className="mr-2" />
              <h3 className="text-lg font-bold">Force Approval Confirmation</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                You are about to override a system exception (<span className="font-bold">{invoice.reason}</span>).
                This action will be logged in the audit trail.
              </p>
              <label className="text-xs font-bold text-gray-700 uppercase block mb-2">Reason Code</label>
              <select
                className="w-full border border-gray-300 rounded-sm p-2 text-sm mb-4"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
              >
                <option value="">Select Reason...</option>
                <option value="commercial_decision">Commercial Decision (GM Approval)</option>
                <option value="data_error">Master Data Error</option>
                <option value="one_time_waiver">One-time Waiver</option>
              </select>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowUnlockModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-sm">Cancel</button>
                <button
                  onClick={() => {
                    if (reasonCode) {
                      finalizeStatus(InvoiceStatus.APPROVED);
                      setShowUnlockModal(false);
                    }
                  }}
                  disabled={!reasonCode}
                  className="px-4 py-2 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-sm disabled:opacity-50"
                >
                  Confirm Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
