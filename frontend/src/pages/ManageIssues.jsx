import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import configService from '../appwrite/config'
import { LoadingSpinner } from '../components/Index'

function ManageIssues() {
	const userData = useSelector(state => state.auth.userData)
	const [issues, setIssues] = useState([])
	const [toast, setToast] = useState(null)
	const [savingId, setSavingId] = useState(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		let unsubscribe = () => {}
		(async () => {
			try {
				setIsLoading(true);
				const initial = await configService.listIssues()
				console.log('ManageIssues - All issues data:', initial);
				console.log('ManageIssues - First issue fileIds:', initial[0]?.fileIds);
				setIssues(initial)
			} catch (error) {
				console.error('Error fetching issues:', error);
			} finally {
				setIsLoading(false);
			}

			unsubscribe = configService.subscribeToIssueEvents((doc) => {
				setIssues(prev => [doc, ...prev])
				setToast(`New issue reported: ${doc.title}`)
				setTimeout(() => setToast(null), 3000)
			})
		})()
		return () => unsubscribe()
	}, [])

	const statuses = ['pending', 'in_progress', 'resolved', 'rejected']

	async function handleStatusChange(issueId, newStatus) {
		setSavingId(issueId)
		try {
			const updated = await configService.updateIssueStatus(issueId, newStatus)
			setIssues(prev => prev.map(i => i.$id === issueId ? { ...i, status: updated.status } : i))
			setToast(`Status updated to ${updated.status}`)
			setTimeout(() => setToast(null), 2000)
		} catch {
			setToast('Failed to update status. Check permissions.')}	finally {
			setSavingId(null)
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 sm:p-6 md:p-8 text-white">
			<h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Manage Issues</h1>
			<p className="mb-4 text-sm sm:text-base">Welcome, {userData?.name || 'Official'}</p>

			{toast && (
				<div className="mb-4 p-3 rounded bg-green-900/40 border border-green-700">{toast}</div>
			)}

			{isLoading ? (
				<LoadingSpinner text="Loading issues..." size="large" />
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				{issues.map((issue) => (
					<div key={issue.$id} className="bg-[#1a1a1a] p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700">
						<h2 className="text-lg sm:text-xl font-semibold">{issue.title}</h2>
						<p className="mt-2 text-gray-400 text-sm sm:text-base">{issue.description}</p>
						
						{/* Image Preview */}
						{issue.fileIds && issue.fileIds.length > 0 && (
							<div className="mt-3">
								<div className="flex gap-2 flex-wrap">
									{issue.fileIds.slice(0, 3).map((fileId, index) => (
										<img
											key={index}
											src={configService.getFileUrl(fileId)}
											alt={`Issue image ${index + 1}`}
											className="w-16 h-16 object-cover rounded-lg border border-gray-600 cursor-pointer hover:scale-110 transition-transform"
											onClick={() => window.open(configService.getFileUrl(fileId), '_blank')}
											onError={(e) => {
												e.target.src = configService.getFileDownloadUrl(fileId);
												e.target.onerror = () => e.target.style.display = 'none';
											}}
										/>
									))}
									{issue.fileIds.length > 3 && (
										<div className="w-16 h-16 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center text-xs text-gray-400">
											+{issue.fileIds.length - 3}
										</div>
									)}
								</div>
							</div>
						)}
						
						<p className="mt-2 text-gray-500 text-xs sm:text-sm">Location: {issue.location}</p>
						<p className="mt-2 text-gray-500 text-xs sm:text-sm">Category: {issue.category}</p>
						<p className="mt-2 text-gray-500 text-xs sm:text-sm">Severity: {issue.severity}</p>
						<div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
							<select
								className="bg-gray-800 text-white p-2 rounded text-sm sm:text-base"
								value={issue.status}
								onChange={(e) => handleStatusChange(issue.$id, e.target.value)}
								disabled={savingId === issue.$id}
							>
								{statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
							</select>
							{savingId === issue.$id && <span className="text-xs sm:text-sm text-gray-400">Saving...</span>}
						</div>
					</div>
				))}
				</div>
			)}
		</div>
	)
}

export default ManageIssues