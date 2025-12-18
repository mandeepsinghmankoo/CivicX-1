import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import configService from "../appwrite/config";
import { LoadingSpinner } from "../components/Index";

function Dashboard() {
  const authStatus = useSelector((state) => state.auth.status);
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState(['pending']);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [urgencyMin, setUrgencyMin] = useState(0);
  const [urgencyMax, setUrgencyMax] = useState(100);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const docs = await configService.listIssues();
        setIssues(docs);
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    let filtered = issues;
    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(issue => selectedStatuses.includes(issue.status));
    }
    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(issue => new Date(issue.$createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(issue => new Date(issue.$createdAt) <= toDate);
    }
    // Urgency filter
    filtered = filtered.filter(issue => (issue.urgency || 0) >= urgencyMin && (issue.urgency || 0) <= urgencyMax);
    setFilteredIssues(filtered);
  }, [issues, selectedStatuses, dateFrom, dateTo, urgencyMin, urgencyMax]);

  if (!authStatus) {
    return <Navigate to="/login" replace />
  }

  return (
    <section className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 sm:p-6 md:p-8 text-white">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Live Issue Dashboard</h1>
        {/* Filters */}
        <div className="mb-6 bg-[#1a1a1a] p-4 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-gray-300 mb-2">Status</label>
              <div className="space-y-1">
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
            {/* Date From */}
            <div>
              <label className="block text-gray-300 mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700"
              />
            </div>
            {/* Date To */}
            <div>
              <label className="block text-gray-300 mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700"
              />
            </div>
            {/* Urgency */}
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
        </div>
        <p className="mb-4 text-sm">Showing {filteredIssues.length} of {issues.length} issues</p>
        {isLoading ? (
          <LoadingSpinner text="Loading issues..." size="large" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredIssues.map((issue) => (
            <Link
              to={`/issues/${issue.$id}`}
              key={issue.$id}
              className="bg-[#1a1a1a] p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 hover:scale-105 transition-transform block"
            >
              <h2 className="text-lg sm:text-xl font-semibold">{issue.title}</h2>
              
              {/* Image Preview */}
              {issue.fileIds && issue.fileIds.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {issue.fileIds.slice(0, 2).map((fileId, index) => (
                      <img
                        key={index}
                        src={configService.getFileUrl(fileId)}
                        alt={`Issue image ${index + 1}`}
                        className="w-12 h-12 object-cover rounded border border-gray-600"
                        onError={(e) => {
                          e.target.src = configService.getFileDownloadUrl(fileId);
                          e.target.onerror = () => e.target.style.display = 'none';
                        }}
                      />
                    ))}
                    {issue.fileIds.length > 2 && (
                      <div className="w-12 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center text-xs text-gray-400">
                        +{issue.fileIds.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <p className="mt-2 text-gray-400 text-sm sm:text-base">Status: {issue.status}</p>
              <p className="mt-1 text-gray-500 text-xs sm:text-sm">Category: {issue.category}</p>
              {issue.address && (
                <p className="mt-1 text-gray-500 text-xs sm:text-sm">📍 {issue.address}</p>
              )}
            </Link>
          ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
