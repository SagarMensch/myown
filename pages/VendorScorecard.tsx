import React, { useState } from 'react';
import { scorecardService } from '../services/scorecardService';
import { BarChart2, TrendingDown, TrendingUp, AlertTriangle, DollarSign, FileText, Truck, Clock } from 'lucide-react';
import { Button } from '../components/Button';

export const VendorScorecard: React.FC = () => {
    const [selectedVendor, setSelectedVendor] = useState('V-ROYAL'); // Default to the "Bad Guy" scenario

    const scorecard = scorecardService.calculateScore(selectedVendor, '2025-04');
    const incidents = scorecardService.getIncidents(selectedVendor);

    const handleDownloadBrief = () => {
        alert("Downloading 'Negotiation_Brief_Royal_Transporters.pdf'...");
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 font-sans overflow-y-auto">
            {/* HEADER */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <BarChart2 className="mr-3 text-indigo-600" />
                        The Blackbook (Vendor Performance)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Performance Analytics & Contract Renewal "Ammunition".
                    </p>
                </div>
                <div className="flex space-x-2">
                    <select className="border border-slate-300 rounded-md py-2 px-3 text-sm bg-white font-medium" value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)}>
                        <option value="V-ROYAL">Royal Transporters (Negotiation Mode)</option>
                        <option value="V-TCI">TCI Express (Top Performer)</option>
                    </select>
                </div>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* 1. REPORT CARD (THE SCORE) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-white font-bold text-lg">{scorecard.vendorName}</h2>
                        <span className={`px-3 py-1 rounded font-bold text-xs ${scorecard.overallScore < 75 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                            {scorecard.overallScore < 75 ? 'AT RISK' : 'PREFERRED'}
                        </span>
                    </div>

                    <div className="p-8 grid grid-cols-4 gap-8">
                        {/* BIG SCORE */}
                        <div className="text-center border-r border-slate-100">
                            <div className={`text-5xl font-black mb-2 ${scorecard.overallScore < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                {scorecard.overallScore}
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Overall Score</p>
                            <div className="mt-4 flex items-center justify-center text-xs text-red-500 font-bold bg-red-50 py-1 rounded">
                                <TrendingDown size={14} className="mr-1" /> Down 12% vs Q1
                            </div>
                        </div>

                        {/* METRIC 1: PLACEMENT */}
                        <div className="text-center">
                            <div className="inline-block p-3 bg-blue-50 rounded-full mb-2">
                                <Truck size={24} className="text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{scorecard.placementScore}%</div>
                            <p className="text-xs text-slate-500 font-medium">Placement</p>
                            <p className="text-[10px] text-slate-400 mt-1">{scorecard.placementFailures} Failures</p>
                        </div>

                        {/* METRIC 2: SPEED */}
                        <div className="text-center">
                            <div className="inline-block p-3 bg-amber-50 rounded-full mb-2">
                                <Clock size={24} className="text-amber-600" />
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{scorecard.speedScore}%</div>
                            <p className="text-xs text-slate-500 font-medium">TAT Adherence</p>
                            <p className="text-[10px] text-slate-400 mt-1">20 Delays</p>
                        </div>

                        {/* METRIC 3: DOCS */}
                        <div className="text-center">
                            <div className="inline-block p-3 bg-purple-50 rounded-full mb-2">
                                <FileText size={24} className="text-purple-600" />
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{scorecard.docScore}%</div>
                            <p className="text-xs text-slate-500 font-medium">POD Submission</p>
                            <p className="text-[10px] text-slate-400 mt-1">Avg 18 Days</p>
                        </div>
                    </div>

                    {/* COST OF FAILURE WIDGET */}
                    <div className="bg-red-50 mx-6 mb-6 p-4 rounded-lg border border-red-100 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-red-100 p-2 rounded-full mr-4">
                                <AlertTriangle className="text-red-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-red-900">Cost of Failure Impact</h4>
                                <p className="text-xs text-red-700">Excess spot premiums & detention charges incurred.</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-red-700">₹{scorecard.costOfFailure.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* 2. LEADERBOARD (SIDEBAR) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                        <TrendingUp size={18} className="mr-2 text-gray-400" /> Monthly Rankings
                    </h3>

                    <div className="space-y-4">
                        {/* Top 2 */}
                        <div className="relative pt-6">
                            <span className="absolute top-0 right-0 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">LEADERS</span>
                            <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-bold text-slate-700">1. TCI Express</span>
                                    <span className="font-bold text-green-600">98</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-bold text-slate-700">2. Blue Dart</span>
                                    <span className="font-bold text-green-600">96</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom 2 */}
                        <div className="relative pt-6 border-t border-slate-100 mt-6">
                            <span className="absolute top-2 right-0 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">LAGGARDS</span>
                            <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-bold text-slate-700">18. Royal Transporters</span>
                                    <span className="font-bold text-red-600">62</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-bold text-slate-700">19. Laxmi Transport</span>
                                    <span className="font-bold text-red-600">52</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '52%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* INCIDENT LOG & ACTIONS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-lg">Critical Incident Log (Q1 2025)</h3>
                    <Button variant="primary" size="sm" onClick={handleDownloadBrief}>
                        <FileText size={16} className="mr-2" /> Download Negotiation Brief
                    </Button>
                </div>

                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <th className="py-3 px-4 text-left font-bold uppercase text-xs">Date</th>
                            <th className="py-3 px-4 text-left font-bold uppercase text-xs">Type</th>
                            <th className="py-3 px-4 text-left font-bold uppercase text-xs">Remarks</th>
                            <th className="py-3 px-4 text-right font-bold uppercase text-xs">Loss Impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.map(inc => (
                            <tr key={inc.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 font-mono text-slate-600">{inc.date}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${inc.type === 'PLACEMENT_FAILURE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {inc.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-slate-700">{inc.remarks}</td>
                                <td className="py-3 px-4 text-right font-bold text-red-600">
                                    {inc.costImpact ? `₹${inc.costImpact.toLocaleString()}` : '-'}
                                </td>
                            </tr>
                        ))}
                        {incidents.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-slate-400">No Critical Incidents found for this period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};
