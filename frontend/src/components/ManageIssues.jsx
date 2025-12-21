import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import configService from '../appwrite/config';
import { addNotification } from '../store/notificationSlice';
import notificationService from '../services/notificationService';

function ManageIssues() {
  const userData = useSelector(state => state.auth.userData);
  const dispatch = useDispatch();
  const [issues, setIssues] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const { soundEnabled } = useSelector(state => state.notifications);

  useEffect(() => { fetchIssues(); }, []);

  const fetchIssues = async () => {
    try { const allIssues = await configService.listIssues(); setIssues(allIssues); } 
    catch (err) { console.error(err); }
  };

  const handleFileChange = (issueId, e) => {
    setSelectedFiles({ ...selectedFiles, [issueId]: e.target.files[0] });
  };

  const uploadConfirmation = async (issueId) => {
    const file = selectedFiles[issueId];
    if (!file) return alert("Select a file first");
    try {
      const uploadedFile = await configService.uploadFile(file);
      await configService.updateIssueStatus(issueId, { status: 'confirmed', confirmationFileId: uploadedFile.$id });
      alert("Confirmation uploaded successfully");
      setSelectedFiles(prev => ({ ...prev, [issueId]: null }));
      fetchIssues();
    } catch (err) { console.error(err); }
  };

  const resolveIssue = async (issue) => {
    try {
      await configService.updateIssueStatus(issue.$id, { status: 'resolved' });
      
      // Only notify if current user is not the one who created the issue
      if (issue.createdBy !== userData.$id) {
        const notification = {
          title: 'Issue Resolved',
          message: `Complaint "${issue.title}" has been marked as resolved`,
          type: 'issue_resolved',
          issueId: issue.$id
        };
        
        dispatch(addNotification(notification));
        
        if (soundEnabled) {
          notificationService.playNotificationSound();
        }
        
        notificationService.showBrowserNotification(
          notification.title,
          notification.message
        );
      }
      
      fetchIssues();
    } catch (err) {
      console.error('Error resolving issue:', err);
    }
  };

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Official Dashboard</h1>
      <p className="mb-4">Welcome, {userData?.name} from {userData?.organization}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {issues.map(issue => (
          <div key={issue.$id} className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold">{issue.title}</h2>
            <p className="text-gray-400 text-sm mb-2">{issue.description}</p>
            <p className="text-gray-400 text-sm mb-2">Category: {issue.category}</p>
            <p className="text-gray-400 text-sm mb-2">Status: {issue.status}</p>
            {issue.address && (
              <p className="text-gray-400 text-sm mb-2">📍 {issue.address}</p>
            )}
            
            {issue.status === 'pending' && (
              <div className="mt-4 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(issue.$id, e)}
                  className="w-full p-2 bg-gray-800 text-white rounded text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => uploadConfirmation(issue.$id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Confirm Issue
                  </button>
                  <button
                    onClick={() => resolveIssue(issue)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            )}

            {issue.status === 'resolved' && issue.confirmationFileId && (
  <div className="mt-2">
    <p className="text-green-400 text-sm mb-1">✅ Resolved</p>
    <a
      href={configService.getFileUrl(issue.confirmationFileId)}
      target="_blank"
      rel="noreferrer"
      className="text-blue-400 text-sm underline"
    >
      View Confirmation Photo
    </a>
  </div>
)}


            {issue.status === 'confirmed' && issue.confirmationFileId && (
              <div className="mt-2">
                <p className="text-green-400 text-xs mb-1">✅ Confirmed</p>
                <a href={configService.getFileUrl(issue.confirmationFileId)} target="_blank" rel="noreferrer" className="text-blue-400 text-xs underline">View Confirmation Photo</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageIssues;
