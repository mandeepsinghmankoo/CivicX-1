import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Query } from 'appwrite'
import configService, { databases } from '../appwrite/config'
import shortner from '../ENV_Shortner/Shortner'
import { LoadingSpinner } from '../components/Index'

function MyIssues() {
	const userData = useSelector(state => state.auth.userData)
	const [issues, setIssues] = useState([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		(async () => {
			try {
				const docs = await configService.listIssues({ queries: [Query.equal('createdBy', userData.$id)] })
				setIssues(docs)
			} finally {
				setLoading(false)
			}
		})()
	}, [userData?.$id])

	if (loading) return <LoadingSpinner text="Loading your issues..." size="large" fullScreen={true} />

	return (
		<section className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 sm:p-6 md:p-8 text-white">
			<h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">My Issues</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				{issues.map((issue) => (
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
		</section>
	)
}

export default MyIssues 