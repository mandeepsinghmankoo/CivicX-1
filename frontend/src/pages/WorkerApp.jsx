import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircle, Navigation } from 'lucide-react';
import configService from '../appwrite/config';

function WorkerApp() {
  const userData = useSelector(state => state.auth.userData);
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchAssignedIssues();
    getCurrentLocation();
  }, []);

  const fetchAssignedIssues = async () => {
    try {
      const allIssues = await configService.listIssues();
      const workerIssues = allIssues.filter(issue =>
        issue.status === 'in_progress' || issue.status === 'pending'
      ).slice(0, 5);
      setAssignedIssues(workerIssues);
    } catch (error) {
      console.error('Error fetching assigned issues:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateBearing = (lat1, lng1, lat2, lng2) => {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  const getBearingDirection = (bearing) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  const getSeverityColor = (severity) => {
    if (severity >= 4) return 'text-red-500';
    if (severity >= 3) return 'text-orange-500';
    return 'text-green-500';
  };

  const startNavigation = (issue) => {
    if (!currentLocation || !issue.lat || !issue.lng) return;

    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      issue.lat,
      issue.lng
    );

    setSelectedIssue({
      ...issue,
      distance: distance.toFixed(2),
      bearing: calculateBearing(currentLocation.lat, currentLocation.lng, issue.lat, issue.lng)
    });
    setIsNavigating(true);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const markAsResolved = async (issue) => {
    if (!selectedFile) return alert("Please select a confirmation photo first.");
    try {
      const uploadedFile = await configService.uploadFile(selectedFile);

      await configService.updateIssueStatus(issue.$id, {
        status: 'resolved',
        confirmationFileId: uploadedFile.$id
      });

      setSelectedFile(null);
      setAssignedIssues(prev => prev.filter(i => i.$id !== issue.$id));
      setSelectedIssue(null);
      setIsNavigating(false);

      // Show success alert
      alert("✅ Issue marked as resolved with confirmation photo.");
    } catch (err) {
      console.error("Error marking resolved:", err);
      alert("❌ Failed to mark as resolved. Try again.");
    }
  };

  const openGoogleMaps = (issue) => {
    if (issue.lat && issue.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${issue.lat},${issue.lng}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🔧 Worker App</h1>
          <p className="text-gray-400">Issue Resolution & Navigation</p>
        </div>
        <div className="text-sm text-gray-400">{userData?.name || 'Worker'}</div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Assigned Issues ({assignedIssues.length})</h2>
            <div className="space-y-3">
              {assignedIssues.map(issue => (
                <div
                  key={issue.$id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedIssue?.$id === issue.$id
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{issue.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${issue.severity >= 4 ? 'bg-red-900 text-red-300' : issue.severity >= 3 ? 'bg-orange-900 text-orange-300' : 'bg-green-900 text-green-300'}`}>
                      {issue.severity}/5
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">{issue.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{issue.category}</span>
                    {currentLocation && issue.lat && issue.lng && (
                      <span>{calculateDistance(currentLocation.lat, currentLocation.lng, issue.lat, issue.lng).toFixed(1)}km</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); startNavigation(issue); }}
                      className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                    >
                      Navigate
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openGoogleMaps(issue); }}
                      className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                    >
                      Google Maps
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedIssue && isNavigating ? (
            <div className="flex-1 bg-gray-900 p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Navigation to Issue</h2>
                  <button
                    onClick={() => setIsNavigating(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Stop Navigation
                  </button>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-2">{selectedIssue.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{selectedIssue.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Category:</span> <span className="ml-2">{selectedIssue.category}</span></div>
                    <div><span className="text-gray-500">Severity:</span> <span className={`ml-2 ${getSeverityColor(selectedIssue.severity)}`}>{selectedIssue.severity}/5</span></div>
                    <div><span className="text-gray-500">Distance:</span> <span className="ml-2">{selectedIssue.distance}km</span></div>
                    <div><span className="text-gray-500">Direction:</span> <span className="ml-2">{getBearingDirection(selectedIssue.bearing)}</span></div>
                  </div>

                  {/* Upload Confirmation Photo */}
                  <div className="flex flex-col gap-2 mt-4">
                    <label className="text-sm text-gray-300">Upload Confirmation Photo:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="px-2 py-1 rounded bg-gray-700 text-white text-xs cursor-pointer"
                      />
                      <button
                        onClick={() => markAsResolved(selectedIssue)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4"/> Mark as Resolved
                      </button>
                    </div>
                    {selectedFile && <span className="text-xs text-green-400">Selected: {selectedFile.name}</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-gray-900 p-6 flex flex-col justify-center items-center text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold mb-4">Worker Dashboard</h2>
              <p className="text-gray-400 mb-6">Select an issue from the sidebar to start navigation and resolve it.</p>
              {assignedIssues.length === 0 && (
                <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-lg font-semibold mb-2">No Assigned Issues</h3>
                  <p className="text-gray-400 text-sm">All issues have been resolved! Check back later for new assignments.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkerApp;
