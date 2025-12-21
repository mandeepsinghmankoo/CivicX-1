import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { LoadingSpinner } from '../components/Index';
import configService from '../appwrite/config';
import { MapPin, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';

function PredictiveIntelligence() {
  const userData = useSelector(state => state.auth.userData);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [timeframe, setTimeframe] = useState('7d');

  useEffect(() => {
    fetchPredictions();
  }, [selectedCategory, riskLevel, timeframe]);

  const fetchPredictions = async () => {
    try {
      setIsLoading(true);
      // TODO: Connect to AI backend endpoint
      // const response = await fetch('/api/predictions', {
      //   params: { category: selectedCategory, riskLevel, timeframe }
      // });
      // const data = await response.json();
      // setPredictions(data);

      // Mock data for UI development
      setPredictions([
        {
          id: 1,
          location: 'Downtown Main Street',
          latitude: 40.7128,
          longitude: -74.0060,
          issueType: 'Pothole',
          category: 'Road Infrastructure',
          riskScore: 8.5,
          probability: '92%',
          predictedDate: '2025-12-20',
          reasoning: 'Heavy traffic patterns combined with recent rainfall increase pothole formation probability',
          affectedArea: '2.5 km radius',
          severity: 'High'
        },
        {
          id: 2,
          location: 'Central Park Area',
          latitude: 40.7829,
          longitude: -73.9654,
          issueType: 'Streetlight Malfunction',
          category: 'Public Safety',
          riskScore: 7.2,
          probability: '78%',
          predictedDate: '2025-12-22',
          reasoning: 'Aging infrastructure combined with weather patterns suggest maintenance issues',
          affectedArea: '1.8 km radius',
          severity: 'Medium'
        },
        {
          id: 3,
          location: 'Harbor District',
          latitude: 40.6892,
          longitude: -74.0445,
          issueType: 'Water Main Leak',
          category: 'Water Management',
          riskScore: 6.8,
          probability: '75%',
          predictedDate: '2025-12-25',
          reasoning: 'Pipe age data and recent pressure fluctuations indicate potential failure',
          affectedArea: '3.2 km radius',
          severity: 'High'
        }
      ]);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 8) return 'text-red-400';
    if (riskScore >= 6) return 'text-orange-400';
    return 'text-yellow-400';
  };

  const getRiskBgColor = (riskScore) => {
    if (riskScore >= 8) return 'bg-red-900/30 border-red-700';
    if (riskScore >= 6) return 'bg-orange-900/30 border-orange-700';
    return 'bg-yellow-900/30 border-yellow-700';
  };

  return (
    <section className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">🧠</div>
            <h1 className="text-3xl sm:text-4xl font-bold">Predictive Intelligence</h1>
          </div>
          <p className="text-gray-400">AI-powered predictions for potential civic issues in your area</p>
        </div>

        {/* Filters */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-700 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Predictions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-[#045c65]"
              >
                <option value="all">All Categories</option>
                <option value="road">Road Infrastructure</option>
                <option value="public-safety">Public Safety</option>
                <option value="water">Water Management</option>
                <option value="utilities">Utilities</option>
              </select>
            </div>

            {/* Risk Level Filter */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Risk Level</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-[#045c65]"
              >
                <option value="all">All Levels</option>
                <option value="high">High (8+)</option>
                <option value="medium">Medium (6-7)</option>
                <option value="low">Low (0-5)</option>
              </select>
            </div>

            {/* Timeframe Filter */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-[#045c65]"
              >
                <option value="7d">Next 7 Days</option>
                <option value="14d">Next 14 Days</option>
                <option value="30d">Next 30 Days</option>
                <option value="90d">Next 90 Days</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchPredictions}
                className="w-full px-4 py-2 bg-[#045c65] hover:bg-[#067a85] text-white rounded-lg font-semibold transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Predictions List */}
        {isLoading ? (
          <LoadingSpinner text="Analyzing patterns..." size="large" />
        ) : predictions.length === 0 ? (
          <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-400">No predictions found for the selected filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div
                key={prediction.id}
                className={`bg-[#1a1a1a] p-6 rounded-xl border ${getRiskBgColor(prediction.riskScore)} hover:scale-[1.02] transition-transform`}
              >
                {/* Top Section */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4 pb-4 border-b border-gray-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={20} className="text-[#067a85]" />
                      <h3 className="text-xl font-semibold">{prediction.issueType}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">
                        {prediction.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <MapPin size={16} />
                      <span>{prediction.location}</span>
                    </div>
                  </div>

                  {/* Risk Score */}
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getRiskColor(prediction.riskScore)}`}>
                      {prediction.riskScore}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">Risk Score</div>
                    <div className="text-white font-semibold mt-1">{prediction.probability}</div>
                  </div>
                </div>

                {/* Middle Section - Prediction Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-700">
                  {/* Predicted Date */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Calendar size={16} />
                      <span>Predicted Date</span>
                    </div>
                    <div className="text-white font-semibold">{prediction.predictedDate}</div>
                  </div>

                  {/* Severity */}
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Severity Level</div>
                    <div className={`font-semibold ${
                      prediction.severity === 'High' ? 'text-red-400' : 'text-orange-400'
                    }`}>
                      {prediction.severity}
                    </div>
                  </div>

                  {/* Affected Area */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <TrendingUp size={16} />
                      <span>Affected Area</span>
                    </div>
                    <div className="text-white font-semibold">{prediction.affectedArea}</div>
                  </div>
                </div>

                {/* Bottom Section - AI Reasoning */}
                <div className="mb-4">
                  <div className="text-gray-400 text-sm mb-2">AI Reasoning:</div>
                  <p className="text-gray-300 text-sm bg-gray-800/50 p-3 rounded-lg">
                    {prediction.reasoning}
                  </p>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-400">Latitude:</span>
                    <span className="text-white ml-2">{prediction.latitude}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Longitude:</span>
                    <span className="text-white ml-2">{prediction.longitude}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2 bg-[#045c65] hover:bg-[#067a85] text-white rounded-lg font-semibold transition-colors">
                    View on Map
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors">
                    Report Similar Issue
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default PredictiveIntelligence;
