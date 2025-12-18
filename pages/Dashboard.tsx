import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Invoice, Notification } from '../types';
import { PredictiveAnalytics } from '../components/PredictiveAnalytics';
import { WhatIfSimulator } from '../components/WhatIfSimulator';
import { CurrencyExposure } from '../components/CurrencyExposure';

interface DashboardProps {
   onNavigate: (page: string) => void;
   activePersona?: any;
   notifications?: Notification[];
   invoices?: Invoice[];
}

// DUMMY DATA FOR SPEND BY REGION
const SPEND_BY_REGION = [
   { name: 'NA', value: 35 },
   { name: 'EMEA', value: 30 },
   { name: 'APAC', value: 25 },
   { name: 'LATAM', value: 10 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// DUMMY DATA FOR TRENDS
const COST_TREND_DATA = [
   { month: 'Jan', actual: 4000, projected: 4100 },
   { month: 'Feb', actual: 3000, projected: 3200 },
   { month: 'Mar', actual: 2000, projected: 2400 },
   { month: 'Apr', actual: 2780, projected: 2900 },
   { month: 'May', actual: 1890, projected: 2100 },
   { month: 'Jun', actual: 2390, projected: 2500 },
   { month: 'Jul', actual: 3490, projected: 3200 },
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, activePersona, notifications = [], invoices = [] }) => {

   // Helper for navigation
   const handleNav = (page: string) => {
      if (onNavigate) onNavigate(page);
   };

   return (
      <div className="p-8 bg-slate-50 min-h-screen">
         {/* Header */}
         <div className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Command Center</h1>
               <p className="text-slate-500 mt-1">Real-time visibility into global logistics and finance operations.</p>
            </div>
            <div className="flex gap-3">
               <button onClick={() => handleNav('integration')} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
                  Manage Integrations
               </button>
               <button onClick={() => handleNav('workbench')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-colors flex items-center">
                  View Audit Logs
               </button>
            </div>
         </div>

         {/* KPI Cards Row - Clickable & Solid Colors */}
         <div className="grid grid-cols-4 gap-6 mb-8">
            <div
               onClick={() => handleNav('settlement')}
               className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
               <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spend (YTD)</p>
                  <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                     +12%
                  </span>
               </div>
               <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">₹24.5M</h3>
            </div>

            <div
               onClick={() => handleNav('workbench')} // Mapping to appropriate page
               className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
               <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Shipments</p>
                  <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                     +5%
                  </span>
               </div>
               <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">12,450</h3>
            </div>

            <div
               onClick={() => handleNav('cps')}
               className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
               <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">On-Time Delivery</p>
                  <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                     Stable
                  </span>
               </div>
               <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">94.2%</h3>
            </div>

            <div
               onClick={() => handleNav('aad')} // Assuming a disputes or exceptions page
               className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
               <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Exceptions</p>
                  <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                     +2 New
                  </span>
               </div>
               <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">14</h3>
            </div>
         </div>

         {/* Charts Row */}
         <div className="grid grid-cols-3 gap-6 mb-8">

            {/* Predictive Analytics Widget */}
            <div className="col-span-2">
               <PredictiveAnalytics />
            </div>

            <div className="col-span-1">
               <CurrencyExposure />
            </div>
         </div>

         {/* Bottom Row: Simulator & Recents */}
         < div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" >
            <div className="col-span-1">
               <WhatIfSimulator />
            </div>

            <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
                  <button onClick={() => handleNav('workbench')} className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
               </div>
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold">

                     <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleNav('workbench')}>
                        <td className="px-6 py-4 font-mono text-slate-500">INV-2023-001</td>
                        <td className="px-6 py-4 font-medium text-slate-700">Oct 24, 2023</td>
                        <td className="px-6 py-4 font-bold text-slate-800">Maersk Logistics - Freight Services</td>
                        <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Approved</span></td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">₹12,450.00</td>
                     </tr>
                     <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleNav('workbench')}>
                        <td className="px-6 py-4 font-mono text-slate-500">INV-2023-002</td>
                        <td className="px-6 py-4 font-medium text-slate-700">Oct 23, 2023</td>
                        <td className="px-6 py-4 font-bold text-slate-800">DHL Express - Air Cargo</td>
                        <td className="px-6 py-4"><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Pending Audit</span></td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">₹3,200.50</td>
                     </tr>
                     <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleNav('workbench')}>
                        <td className="px-6 py-4 font-mono text-slate-500">INV-2023-003</td>
                        <td className="px-6 py-4 font-medium text-slate-700">Oct 22, 2023</td>
                        <td className="px-6 py-4 font-bold text-slate-800">MSC - Container Lease</td>
                        <td className="px-6 py-4"><span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Exception</span></td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">₹8,900.00</td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};
