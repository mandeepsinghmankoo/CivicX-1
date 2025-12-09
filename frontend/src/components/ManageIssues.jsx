import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import configService from '../appwrite/config';

function ManageIssues() {
  const userData = useSelector(state => state.auth.userData);
  const [issues, setIssues] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});

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

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Official Dashboard</h1>
      <p className="mb-4">Welcome, {userData?.name} from {userData?.organization}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {issues.map(issue => (
          <div key={issue.$id} className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold">{issue.title}</h2>
            <p className="text-gray-400 text-sm mb-2">{issue.description}</p>
            <p className="text-gray-400 text-sm mb-2">Status: {issue.status}</p>

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
