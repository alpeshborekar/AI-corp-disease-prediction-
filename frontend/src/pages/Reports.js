import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const [reportData, setReportData] = useState({});
  const [activeReport, setActiveReport] = useState('disease-prevalence');

  useEffect(() => {
    loadReports();
  }, [activeReport]);

  const loadReports = async () => {
    try {
      let response;
      switch(activeReport) {
        case 'disease-prevalence':
          response = await reportsAPI.getDiseasePrevalence();
          break;
        case 'regional-analysis':
          response = await reportsAPI.getRegionalAnalysis();
          break;
        default:
          response = await reportsAPI.getSystemUsage();
      }
      setReportData(response.data);
    } catch (error) {
      console.error('Load reports error:', error);
    }
  };

  const reportTabs = [
    { id: 'disease-prevalence', label: 'Disease Trends' },
    { id: 'regional-analysis', label: 'Regional Data' },
    { id: 'system-usage', label: 'System Usage' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics & Reports</h1>
        
        <div className="card p-1 mb-8">
          <nav className="flex space-x-1">
            {reportTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg ${
                  activeReport === tab.id ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Disease Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.diseasePrevalence || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Predictions</span>
                <span className="font-semibold">{reportData.summary?.totalPredictions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique Diseases</span>
                <span className="font-semibold">{reportData.summary?.uniqueDiseases || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Reports;
