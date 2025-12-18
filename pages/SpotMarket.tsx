import React, { useState, useEffect } from 'react';
import { spotService } from '../services/spotService';
import { SpotIndent, SpotVendor } from '../types';
import { Truck, Gavel, Plus, Search, CheckCircle, AlertTriangle, Clock, MapPin, DollarSign, X } from 'lucide-react';

export const SpotMarket: React.FC = () => {
    // State
    const [indents, setIndents] = useState<SpotIndent[]>([]);
    const [vendors, setVendors] = useState<SpotVendor[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndent, setSelectedIndent] = useState<SpotIndent | null>(null);

    // Form State
    const [newIndent, setNewIndent] = useState({
        origin: '',
        destination: '',
        vehicleType: '32ft MXL',
        weightTon: 15,
        benchmarkPrice: 40000,
        selectedVendorIds: [] as string[]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setIndents(spotService.getAllIndents());
        setVendors(spotService.getVendors());
    };

    const handleCreate = () => {
        if (!newIndent.origin || !newIndent.destination || newIndent.selectedVendorIds.length === 0) {
            alert("Please fill all fields and select at least one vendor.");
            return;
        }
        spotService.createIndent(newIndent);
        setIsCreateModalOpen(false);
        loadData();
        // Reset Form
        setNewIndent({ ...newIndent, origin: '', destination: '', selectedVendorIds: [] });
    };

    const toggleVendor = (vId: string) => {
        setNewIndent(prev => {
            const exists = prev.selectedVendorIds.includes(vId);
            return {
                ...prev,
                selectedVendorIds: exists
                    ? prev.selectedVendorIds.filter(id => id !== vId)
                    : [...prev.selectedVendorIds, vId]
            };
        });
    };

    const handleApprove = (indentId: string, bidId: string) => {
        const result = spotService.approveBooking(indentId, bidId);
        if (result.success) {
            alert(`Booking Confirmed! Ref: ${result.bookingRef}`);
            loadData();
            if (selectedIndent && selectedIndent.id === indentId) {
                // Refresh detailed view logic if needed, or just close
                setSelectedIndent(spotService.getIndentById(indentId) || null);
            }
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="h-full flex flex-col font-sans bg-[#F4F7FE] overflow-hidden relative">

            {/* DEBUG INFO FOR SIMULATION */}
            <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-200 text-xs text-yellow-800 flex justify-between">
                <span><b>Simulation Mode:</b> Check console for WhatsApp Links to simulate Vendor Bids.</span>
                <button onClick={() => console.clear()} className="underline">Clear Console</button>
            </div>

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-[#1B2559] px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Create Spot Indent</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div className="col-span-1 space-y-4">
                                <h4 className="text-sm font-bold text-gray-700 uppercase border-b pb-2">Load Details</h4>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Origin</label>
                                    <input className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Pune" value={newIndent.origin} onChange={e => setNewIndent({ ...newIndent, origin: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination</label>
                                    <input className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Delhi" value={newIndent.destination} onChange={e => setNewIndent({ ...newIndent, destination: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehicle</label>
                                        <select className="w-full border p-2 rounded text-sm" value={newIndent.vehicleType} onChange={e => setNewIndent({ ...newIndent, vehicleType: e.target.value })}>
                                            <option>32ft MXL</option>
                                            <option>19ft Open</option>
                                            <option>10-Tyre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Benchmark (₹)</label>
                                        <input type="number" className="w-full border p-2 rounded text-sm" value={newIndent.benchmarkPrice} onChange={e => setNewIndent({ ...newIndent, benchmarkPrice: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 space-y-4 flex flex-col">
                                <h4 className="text-sm font-bold text-gray-700 uppercase border-b pb-2">Select Vendors (WhatsApp)</h4>
                                <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2">
                                    {vendors.map(v => (
                                        <div key={v.id} onClick={() => toggleVendor(v.id)} className={`p-3 rounded border cursor-pointer flex justify-between items-center ${newIndent.selectedVendorIds.includes(v.id) ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{v.name}</div>
                                                <div className="text-xs text-gray-500">{v.phone}</div>
                                            </div>
                                            {newIndent.selectedVendorIds.includes(v.id) && <CheckCircle size={16} className="text-blue-500" />}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleCreate} className="w-full bg-[#E56910] text-white font-bold py-3 rounded shadow hover:bg-orange-700 transition">Broadcast Indent</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-end flex-shrink-0">
                <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Ad-Hoc Procurement</h2>
                    <h1 className="text-3xl font-extrabold text-[#1B2559] tracking-tight flex items-center">
                        Spot Auction Console <Gavel className="ml-3 text-[#E56910]" size={28} />
                    </h1>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center px-6 py-3 bg-[#1B2559] text-white font-bold rounded hover:bg-[#151b42] shadow-lg transition-all">
                    <Plus size={20} className="mr-2" /> New Spot Indent
                </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-hidden flex">
                {/* LEFT: INDENT LIST */}
                <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <input className="w-full pl-9 pr-3 py-2 border rounded text-sm" placeholder="Search Indents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        {indents.filter(i => i.origin.toLowerCase().includes(searchQuery) || i.destination.toLowerCase().includes(searchQuery)).map(indent => (
                            <div
                                key={indent.id}
                                onClick={() => setSelectedIndent(indent)}
                                className={`p-4 border-b cursor-pointer transition-colors ${selectedIndent?.id === indent.id ? 'bg-blue-50 border-l-4 border-l-[#0F62FE]' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-[#1B2559] text-sm">{indent.id}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${indent.status === 'BOOKED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{indent.status}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <span>{indent.origin}</span>
                                    <span className="text-gray-400">→</span>
                                    <span>{indent.destination}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <div className="flex items-center"><Truck size={12} className="mr-1" /> {indent.vehicleType}</div>
                                    <div className="flex items-center"><Clock size={12} className="mr-1" /> {new Date(indent.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: AUCTION AUDIT */}
                <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                    {selectedIndent ? (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* STATUS CARD */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-[#1B2559]">{selectedIndent.origin} to {selectedIndent.destination}</h2>
                                        <p className="text-sm text-gray-500 mt-1">{selectedIndent.vehicleType} • {selectedIndent.weightTon} Ton • Benchmark: ₹{selectedIndent.benchmarkPrice.toLocaleString()}</p>
                                    </div>
                                    {selectedIndent.status === 'BOOKED' && (
                                        <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200 text-right">
                                            <p className="text-xs text-green-600 font-bold uppercase">Booked at</p>
                                            <p className="text-2xl font-bold text-green-700">₹{selectedIndent.approvedPrice?.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-500 font-mono">{selectedIndent.spotBookingRef}</p>
                                        </div>
                                    )}
                                </div>

                                {/* BIDS TABLE */}
                                <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Bid Sheet</h3>
                                <div className="border rounded-lg overflow-hidden bg-white">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-xs text-gray-500 uppercase font-bold text-left">
                                            <tr>
                                                <th className="px-4 py-3">Vendor</th>
                                                <th className="px-4 py-3">Bid Amount</th>
                                                <th className="px-4 py-3">Variance</th>
                                                <th className="px-4 py-3">Remarks</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedIndent.vendorRequests.filter(r => r.bid).sort((a, b) => (a.bid!.amount - b.bid!.amount)).map((req, idx) => {
                                                const bid = req.bid!;
                                                const variance = ((bid.amount - selectedIndent.benchmarkPrice) / selectedIndent.benchmarkPrice) * 100;
                                                const isWinner = selectedIndent.winningBidId === bid.id;
                                                return (
                                                    <tr key={bid.id} className={`${isWinner ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                                        <td className="px-4 py-3 font-medium">
                                                            {bid.vendorName}
                                                            {idx === 0 && <span className="ml-2 px-1.5 py-0.5 bg-[#E56910] text-white text-[10px] rounded font-bold">L1</span>}
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-[#1B2559]">₹{bid.amount.toLocaleString()}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-xs font-bold ${variance > 15 ? 'text-red-500' : variance > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                                                                {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500 text-xs italic">{bid.remarks || '-'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            {selectedIndent.status === 'BOOKED' ? (
                                                                isWinner ? <span className="text-green-600 font-bold text-xs flex items-center justify-end"><CheckCircle size={14} className="mr-1" /> Awarded</span> : <span className="text-gray-400 text-xs">Lost</span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleApprove(selectedIndent.id, bid.id)}
                                                                    className={`text-xs px-3 py-1.5 rounded font-bold transition-all ${variance > 15 ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                                                >
                                                                    {variance > 15 ? 'Request VP Approval' : 'Approve & Book'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {selectedIndent.vendorRequests.filter(r => r.bid).length === 0 && (
                                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No bids received yet. Check WhatsApp status.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 p-4 rounded bg-blue-50 border border-blue-100 flex items-start">
                                    <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600"><DollarSign size={20} /></div>
                                    <div>
                                        <h4 className="font-bold text-blue-900 text-sm">Smart Analysis</h4>
                                        <p className="text-xs text-blue-800 mt-1">
                                            Benchmark calculated based on active contract lanes. Variance greater than 15% triggers mandatory VP approval workflow.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Gavel size={64} className="mb-4 opacity-20" />
                            <p>Select an indent to view the auction console</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
