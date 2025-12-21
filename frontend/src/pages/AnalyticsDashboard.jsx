/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import configService from '../appwrite/config';
import { LoadingSpinner } from '../components/Index';

function AnalyticsDashboard() {
  const userData = useSelector(state => state.auth.userData);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    pendingIssues: 0,
    categoryStats: {},
    severityStats: {},
    monthlyTrends: [],
    hotSpots: []
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState(['pending', 'in_progress', 'resolved']);
  const [urgencyMin, setUrgencyMin] = useState(0);
  const [urgencyMax, setUrgencyMax] = useState(100);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeframe, selectedCategory, selectedStatuses, urgencyMin, urgencyMax]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const allIssues = await configService.listIssues();
      setIssues(allIssues);
      
      // Calculate analytics
      const now = new Date();
      const timeframeDays = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));
      
      const filteredIssues = allIssues.filter(issue =>
        new Date(issue.$createdAt) >= cutoffDate &&
        (selectedCategory === 'all' || issue.category === selectedCategory)
      );

      // Additional filters
      let additionalFiltered = filteredIssues.filter(issue =>
        selectedStatuses.includes(issue.status) &&
        (issue.urgency || 0) >= urgencyMin &&
        (issue.urgency || 0) <= urgencyMax
      );

      // Basic stats
      const totalIssues = additionalFiltered.length;
      const resolvedIssues = filteredIssues.filter(issue => issue.status === 'resolved').length;
      const pendingIssues = filteredIssues.filter(issue => issue.status === 'pending' || issue.status === 'in_progress').length;

      // Category statistics
      const categoryStats = {};
      additionalFiltered.forEach(issue => {
        categoryStats[issue.category] = (categoryStats[issue.category] || 0) + 1;
      });

      // Severity statistics
      const severityStats = {};
      additionalFiltered.forEach(issue => {
        const severity = issue.severity || 3;
        severityStats[severity] = (severityStats[severity] || 0) + 1;
      });

      // Monthly trends
      const monthlyTrends = [];
      for (let i = timeframeDays - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dayIssues = additionalFiltered.filter(issue => {
          const issueDate = new Date(issue.$createdAt);
          return issueDate.toDateString() === date.toDateString();
        });
        monthlyTrends.push({
          date: date.toISOString().split('T')[0],
          count: dayIssues.length,
          resolved: dayIssues.filter(issue => issue.status === 'resolved').length
        });
      }

      // Hot spots (clustered issues by location)
      const hotSpots = calculateHotSpots(additionalFiltered);

      setAnalytics({
        totalIssues,
        resolvedIssues,
        pendingIssues,
        categoryStats,
        severityStats,
        monthlyTrends,
        hotSpots
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHotSpots = (issues) => {
    const spots = {};
    issues.forEach(issue => {
      if (issue.lat && issue.lng) {
        // Round coordinates to create clusters
        const lat = Math.round(issue.lat * 100) / 100;
        const lng = Math.round(issue.lng * 100) / 100;
        const key = `${lat},${lng}`;
        
        if (!spots[key]) {
          spots[key] = {
            lat,
            lng,
            count: 0,
            categories: {},
            severity: 0
          };
        }
        
        spots[key].count++;
        spots[key].categories[issue.category] = (spots[key].categories[issue.category] || 0) + 1;
        spots[key].severity = Math.max(spots[key].severity, issue.severity || 3);
      }
    });

    return Object.values(spots)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getSeverityColor = (severity) => {
    if (severity >= 4) return 'text-red-500';
    if (severity >= 3) return 'text-orange-500';
    return 'text-green-500';
  };

  const getHotSpotIntensity = (count) => {
    if (count >= 10) return 'bg-red-500';
    if (count >= 5) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading analytics..." size="large" fullScreen={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">📊 Analytics Dashboard</h1>
          <p className="text-gray-400">Real-time insights and heatmaps for civic issues</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-wrap gap-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
          >
            <option value="all">All Categories</option>
            <option value="Pothole">Potholes</option>
            <option value="Streetlight">Streetlights</option>
            <option value="Sewer Overflow">Sewer Issues</option>
            <option value="Garbage">Garbage</option>
            <option value="Water Leak">Water Issues</option>
          </select>

          <div>
            <label className="block text-gray-300 mb-2">Status</label>
            <div className="flex space-x-4">
              {['pending', 'in_progress', 'resolved'].map(status => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStatuses([...selectedStatuses, status]);
                      } else {
                        setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                      }
                    }}
                    className="mr-2"
                  />
                  {status.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Urgency ({urgencyMin}% - {urgencyMax}%)</label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={urgencyMin}
                onChange={(e) => setUrgencyMin(Number(e.target.value))}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={urgencyMax}
                onChange={(e) => setUrgencyMax(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Issues</p>
                <p className="text-3xl font-bold text-blue-400">{analytics.totalIssues}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolved</p>
                <p className="text-3xl font-bold text-green-400">{analytics.resolvedIssues}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-orange-400">{analytics.pendingIssues}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolution Rate</p>
                <p className="text-3xl font-bold text-purple-400">
                  {analytics.totalIssues > 0 ? Math.round((analytics.resolvedIssues / analytics.totalIssues) * 100) : 0}%
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">📊 Issues by Category</h3>
            <div className="space-y-3">
              {Object.entries(analytics.categoryStats)
                .sort(([,a], [,b]) => b - a)
                .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-gray-300">{category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(count / analytics.totalIssues) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">⚠️ Issues by Severity</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(severity => (
                <div key={severity} className="flex items-center justify-between">
                  <span className={`font-semibold ${getSeverityColor(severity)}`}>
                    Level {severity}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          severity >= 4 ? 'bg-red-500' : severity >= 3 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(analytics.severityStats[severity] || 0) / analytics.totalIssues * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold w-8 text-right">
                      {analytics.severityStats[severity] || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
          <h3 className="text-xl font-semibold mb-4">📈 Daily Trends</h3>
          <div className="h-64 flex items-end gap-2">
            {analytics.monthlyTrends.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-700 rounded-t mb-2 relative">
                  <div 
                    className="bg-blue-500 rounded-t transition-all duration-500"
                    style={{ height: `${(day.count / Math.max(...analytics.monthlyTrends.map(d => d.count))) * 200}px` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 transform -rotate-45 origin-left">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Spots Map */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">🗺️ Issue Hot Spots</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.hotSpots.map((spot, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">Hot Spot #{index + 1}</span>
                  <div className={`w-4 h-4 rounded-full ${getHotSpotIntensity(spot.count)}`}></div>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  📍 {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                </p>
                <p className="text-blue-400 font-semibold mb-2">{spot.count} issues</p>
                <div className="space-y-1">
                  {Object.entries(spot.categories).map(([category, count]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="text-gray-300">{category}</span>
                      <span className="text-white">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    spot.severity >= 4 ? 'bg-red-900 text-red-300' : 
                    spot.severity >= 3 ? 'bg-orange-900 text-orange-300' : 
                    'bg-green-900 text-green-300'
                  }`}>
                    Severity: {spot.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
