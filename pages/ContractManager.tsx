import React, { useState, useEffect } from 'react';
import { contractService } from '../services/contractService';
import { Contract, VehicleType } from '../types';
import { Truck, Fuel, Calculator, FileText, AlertTriangle, CheckCircle, Search, Plus, Upload, Download, Filter, ChevronDown, MoreHorizontal, X, Save } from 'lucide-react';

export const ContractManager: React.FC = () => {
    // --- STATE ---
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Simulator State
    const [simContractId, setSimContractId] = useState('');
    const [simOrigin, setSimOrigin] = useState('Mumbai');
    const [simDest, setSimDest] = useState('Delhi');
    const [simVehicle, setSimVehicle] = useState<VehicleType>('32ft MXL');
    const [simDiesel, setSimDiesel] = useState(92);
    const [simDist, setSimDist] = useState(1400);
    const [simResult, setSimResult] = useState<any>(null);

    // New Contract Form State
    const [newContract, setNewContract] = useState<Partial<Contract>>({
        vendorName: '',
        serviceType: 'FTL',
        paymentTerms: 'Net 45',
        pvcConfig: { baseDieselPrice: 90, mileageBenchmark: 4, referenceCity: 'Mumbai' }
    });

    // --- EFFECTS ---
    useEffect(() => {
        const data = contractService.getAll();
        setContracts(data);
        if (data.length > 0) setSimContractId(data[0].id);
    }, []);

    // --- HANDLERS ---
    const handleSimulate = () => {
        const result = contractService.calculateFreight({
            contractId: simContractId,
            origin: simOrigin,
            destination: simDest,
            vehicleType: simVehicle,
            currentDieselPrice: simDiesel,
            distanceKm: simDist,
            weight: 15000 // default for FTL
        });
        setSimResult(result);
    };

    const handleCreateContract = () => {
        const id = `CON-2025-${String(contracts.length + 1).padStart(3, '0')}`;
        const newRecord: Contract = {
            id,
            vendorId: `V-${Date.now()}`,
            vendorName: newContract.vendorName || 'New Vendor',
            serviceType: newContract.serviceType as any,
            validFrom: new Date().toISOString().split('T')[0],
            validTo: new Date(Date.now() + 31536000000).toISOString().split('T')[0], // +1 Year
            paymentTerms: newContract.paymentTerms as any,
            isRCMApplicable: true,
            status: 'DRAFT',
            freightMatrix: [], // Empty for now
            pvcConfig: newContract.pvcConfig as any,
            accessorials: {
                loadingUnloading: { isIncluded: true },
                detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 1500, excludeHolidays: true },
                oda: { distanceThreshold: 50, surcharge: 2000 },
                tolls: { isInclusive: false }
            }
        };
        contractService.add(newRecord);
        setContracts(contractService.getAll()); // Refresh
        setIsCreateModalOpen(false);
    };

    const handleExportCSV = () => {
        const headers = ['Contract ID', 'Vendor', 'Service Type', 'Valid From', 'Valid To', 'Status'];
        const rows = contracts.map(c => [c.id, c.vendorName, c.serviceType, c.validFrom, c.validTo, c.status]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "contracts_master.csv");
        document.body.appendChild(link);
        link.click();
    };

    // --- FILTERING ---
    const filteredContracts = contracts.filter(c =>
        c.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col font-sans bg-[#F4F7FE] overflow-hidden relative">

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-[#1B2559] px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Create New Contract</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vendor Name</label>
                                <input
                                    autoFocus
                                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#0F62FE] outline-none"
                                    placeholder="e.g. DHL Supply Chain"
                                    value={newContract.vendorName}
                                    onChange={e => setNewContract({ ...newContract, vendorName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#0F62FE] outline-none"
                                        value={newContract.serviceType}
                                        onChange={e => setNewContract({ ...newContract, serviceType: e.target.value as any })}
                                    >
                                        <option value="FTL">FTL (Full Truck)</option>
                                        <option value="LTL">LTL (Part Load)</option>
                                        <option value="Express">Express</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Terms</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#0F62FE] outline-none"
                                        value={newContract.paymentTerms}
                                        onChange={e => setNewContract({ ...newContract, paymentTerms: e.target.value as any })}
                                    >
                                        <option>Net 30</option>
                                        <option>Net 45</option>
                                        <option>Net 60</option>
                                    </select>
                                </div>
                            </div>

                            <hr className="border-gray-100" />
                            <h4 className="text-sm font-bold text-[#1B2559]">PVC Defaults</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Diesel (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#0F62FE] outline-none"
                                        value={newContract.pvcConfig?.baseDieselPrice}
                                        onChange={e => setNewContract({ ...newContract, pvcConfig: { ...newContract.pvcConfig!, baseDieselPrice: Number(e.target.value) } })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Benchmark (KMPL)</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#0F62FE] outline-none"
                                        value={newContract.pvcConfig?.mileageBenchmark}
                                        onChange={e => setNewContract({ ...newContract, pvcConfig: { ...newContract.pvcConfig!, mileageBenchmark: Number(e.target.value) } })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreateContract}
                                className="w-full bg-[#0F62FE] text-white font-bold py-3 rounded shadow hover:bg-blue-700 transition flex items-center justify-center mt-4"
                            >
                                <Save size={18} className="mr-2" /> Save Contract Header
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Header Section */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Logistics Procurement</h2>
                        <h1 className="text-3xl font-extrabold text-[#1B2559] tracking-tight">Contract Master</h1>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 text-sm shadow-sm transition-all"
                        >
                            <Download size={18} className="mr-2 text-gray-500" /> Export Template
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center px-5 py-2.5 bg-[#0F62FE] text-white font-bold rounded-sm hover:bg-[#0353E9] text-sm shadow-md transition-all"
                        >
                            <Plus size={18} className="mr-2" /> Create Contract
                        </button>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="mt-8 grid grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="z-10">
                            <p className="text-sm font-medium text-gray-500">Active Agreements</p>
                            <h3 className="text-3xl font-bold text-[#1B2559] mt-2">{contracts.filter(c => c.status === 'ACTIVE').length}</h3>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1 bg-[#0F62FE]"></div>
                        <div className="absolute -right-6 -bottom-6 text-gray-50 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileText size={100} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="z-10">
                            <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                            <h3 className="text-3xl font-bold text-red-600 mt-2">1</h3>
                            <p className="text-xs text-red-500 font-medium mt-1 flex items-center"><AlertTriangle size={12} className="mr-1" /> Action Required</p>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1 bg-red-500"></div>
                        <div className="absolute -right-6 -bottom-6 text-red-50 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle size={100} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="z-10">
                            <p className="text-sm font-medium text-gray-500">Drafts / Pending</p>
                            <h3 className="text-3xl font-bold text-[#E56910] mt-2">{contracts.filter(c => c.status !== 'ACTIVE').length}</h3>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1 bg-[#E56910]"></div>
                        <div className="absolute -right-6 -bottom-6 text-[#E56910] opacity-10 group-hover:opacity-20 transition-opacity">
                            <Fuel size={100} />
                        </div>
                    </div>

                    <div className="bg-[#1B2559] p-5 rounded-xl border border-gray-800 shadow-md flex flex-col justify-between h-32 relative overflow-hidden">
                        <div className="z-10">
                            <p className="text-sm font-medium text-blue-200">National Diesel (Ref)</p>
                            <h3 className="text-3xl font-bold text-white mt-2">₹91.25</h3>
                            <p className="text-xs text-green-400 font-medium mt-1">+1.2% vs Last Month</p>
                        </div>
                        <Fuel size={80} className="absolute -right-4 -bottom-4 text-blue-900 opacity-20" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">

                <div className="grid grid-cols-12 gap-8">
                    {/* LEFT PANEL: Contracts List */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-[#1B2559] text-base">All Contracts</h3>
                                <div className="flex space-x-2 relative">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg w-48 outline-none focus:border-[#0F62FE]"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                        <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-[#0F62FE] hover:bg-blue-50 rounded-lg transition-colors"><Filter size={18} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4">Contract ID</th>
                                            <th className="px-6 py-4">Vendor</th>
                                            <th className="px-6 py-4">Coverage</th>
                                            <th className="px-6 py-4">PVC Base</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredContracts.map(c => (
                                            <tr key={c.id} className="hover:bg-gray-50 group cursor-pointer transition-colors" onClick={() => setSimContractId(c.id)}>
                                                <td className="px-6 py-4">
                                                    <div className="font-mono text-[#0F62FE] font-bold">{c.id}</div>
                                                    <div className="text-[10px] text-gray-400">{c.validFrom} - {c.validTo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800">{c.vendorName}</div>
                                                    <div className="text-xs text-gray-500">{c.serviceType}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                        {c.freightMatrix.length} Routes
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-900 font-bold">₹{c.pvcConfig.baseDieselPrice}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium">Ref: {c.pvcConfig.referenceCity}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-gray-400 hover:text-[#1B2559]"><MoreHorizontal size={20} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredContracts.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-gray-400 text-xs">No contracts found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Simulator */}
                    <div className="col-span-12 lg:col-span-4">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-6">
                            <div className="bg-[#1B2559] px-6 py-5 border-b border-gray-800">
                                <h3 className="text-white font-bold text-lg flex items-center">
                                    <Calculator size={20} className="mr-3 text-[#0F62FE]" />
                                    Rate Simulator
                                </h3>
                                <p className="text-[#A0AEC0] text-xs mt-1">Verify Module 1 Dynamic Pricing Logic</p>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Contract</label>
                                        <div className="relative">
                                            <select
                                                className="w-full text-sm bg-gray-50 border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-[#0F62FE] appearance-none cursor-pointer font-medium"
                                                value={simContractId}
                                                onChange={(e) => setSimContractId(e.target.value)}
                                            >
                                                {contracts.map(c => <option key={c.id} value={c.id}>{c.vendorName} ({c.id})</option>)}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Origin</label>
                                            <input
                                                type="text"
                                                className="w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-2 focus:ring-[#0F62FE] outline-none"
                                                value={simOrigin}
                                                onChange={(e) => setSimOrigin(e.target.value)}
                                                placeholder="City"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination</label>
                                            <input
                                                type="text"
                                                className="w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-2 focus:ring-[#0F62FE] outline-none"
                                                value={simDest}
                                                onChange={(e) => setSimDest(e.target.value)}
                                                placeholder="City"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehicle Type</label>
                                        <div className="relative">
                                            <select
                                                className="w-full text-sm bg-gray-50 border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-[#0F62FE] appearance-none cursor-pointer"
                                                value={simVehicle}
                                                onChange={(e) => setSimVehicle(e.target.value as VehicleType)}
                                            >
                                                <option>32ft MXL</option>
                                                <option>32ft SXL</option>
                                                <option>10-Tyre</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Diesel (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-2 focus:ring-[#0F62FE] outline-none"
                                                value={simDiesel}
                                                onChange={(e) => setSimDiesel(Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dist (Km)</label>
                                            <input
                                                type="number"
                                                className="w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-2 focus:ring-[#0F62FE] outline-none"
                                                value={simDist}
                                                onChange={(e) => setSimDist(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSimulate}
                                        className="w-full bg-[#0F62FE] text-white font-bold py-3 rounded-md shadow-lg hover:bg-[#0353E9] transition-all transform active:scale-95"
                                    >
                                        Calculate Rate
                                    </button>
                                </div>

                                {/* Results Area */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[160px] flex flex-col justify-center">
                                    {simResult ? (
                                        simResult.isError ? (
                                            <div className="text-center text-red-600">
                                                <AlertTriangle size={24} className="mx-auto mb-2" />
                                                <p className="font-bold text-sm">{simResult.errorMessage}</p>
                                            </div>
                                        ) : (
                                            <div className="animate-fade-in-up">
                                                <div className="flex justify-between items-baseline mb-4 border-b border-gray-200 pb-2">
                                                    <span className="text-gray-500 text-xs font-bold uppercase">Total Cost</span>
                                                    <span className="text-2xl font-extrabold text-[#1B2559]">₹{simResult.totalCost.toLocaleString()}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {simResult.breakdown.map((line: string, idx: number) => (
                                                        <div key={idx} className="text-[11px] flex items-start text-gray-600">
                                                            <div className="w-1.5 h-1.5 bg-[#0F62FE] rounded-full mr-2 mt-1 flex-shrink-0"></div>
                                                            <span className="font-medium">{line}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Verification Badge */}
                                                {Math.abs(simResult.totalCost - 40700) < 50 && simDiesel === 92 && (
                                                    <div className="mt-4 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded shadow-sm flex items-center justify-center">
                                                        <CheckCircle size={14} className="mr-2" /> Logic Verified
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Calculator size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-xs">Enter logic parameters to test pricing engine.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
