import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import configService from '../appwrite/config'
import { LoadingSpinner } from '../components/Index'

function ManageIssues() {
	const navigate = useNavigate()
	const userData = useSelector(state => state.auth.userData)
	const [issues, setIssues] = useState([])
	const [filteredIssues, setFilteredIssues] = useState([])
	const [toast, setToast] = useState(null)
	const [isLoading, setIsLoading] = useState(true)

	// Filter states
	const [selectedStatuses, setSelectedStatuses] = useState(['pending', 'in_progress', 'resolved'])
	const [dateFrom, setDateFrom] = useState('')
	const [dateTo, setDateTo] = useState('')
	const [urgencyMin, setUrgencyMin] = useState(0)
	const [urgencyMax, setUrgencyMax] = useState(100)

	useEffect(() => {
		let unsubscribe = () => {}
		(async () => {
			try {
				setIsLoading(true);
				const initial = await configService.listIssues()
				console.log('ManageIssues - All issues data:', initial);
				console.log('ManageIssues - First issue fileIds:', initial[0]?.fileIds);
				setIssues(initial)
				setFilteredIssues(initial)
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
	}, [issues, selectedStatuses, dateFrom, dateTo, urgencyMin, urgencyMax])

	

	return (
		<div className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 sm:p-6 md:p-8 text-white">
			<h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Manage Issues</h1>
			<p className="mb-4 text-sm sm:text-base">Welcome, {userData?.name || 'Official'}</p>

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

			{toast && (
				<div className="mb-4 p-3 rounded bg-[#045c65]/40 border border-[#067a85]">{toast}</div>
			)}

			<p className="mb-4 text-sm">Showing {filteredIssues.length} of {issues.length} issues</p>

			{isLoading ? (
				<LoadingSpinner text="Loading issues..." size="large" />
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				{filteredIssues.map((issue) => (
					<div key={issue.$id} className="bg-[#1a1a1a] p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 cursor-pointer hover:bg-[#2a2a2a] transition-colors" onClick={() => navigate(`/issues/${issue.$id}`)}>
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
											onClick={(e) => { e.stopPropagation(); window.open(configService.getFileUrl(fileId), '_blank'); }}
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
						
					</div>
				))}
				</div>
			)}
		</div>
	)
}

export default ManageIssues