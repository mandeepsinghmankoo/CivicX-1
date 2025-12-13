import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import configService from '../appwrite/config'
import { LoadingSpinner } from '../components/Index'

function IssueDetail() {
	const { issueId } = useParams()
	const [issue, setIssue] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [imageUrls, setImageUrls] = useState([])
	// Comments state
	const [comments, setComments] = useState([]);
	const [commentInput, setCommentInput] = useState("");
	const [commentLoading, setCommentLoading] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const doc = await configService.getIssueById(issueId)
				setIssue(doc)

				// Get image URLs if fileIds exist
				if (doc.fileIds && doc.fileIds.length > 0) {
					const urls = await Promise.all(doc.fileIds.map(async (fileId) => {
						const viewUrl = configService.getFileUrl(fileId);
						const downloadUrl = configService.getFileDownloadUrl(fileId);

						// Try to create a blob URL for better compatibility
						try {
							const response = await fetch(viewUrl);
							if (response.ok) {
								const blob = await response.blob();
								const blobUrl = URL.createObjectURL(blob);
								return { viewUrl, downloadUrl, fileId, blobUrl };
							}
						} catch (error) {
							console.log(`Failed to create blob for ${fileId}:`, error);
						}

						return { viewUrl, downloadUrl, fileId };
					}));
					setImageUrls(urls)
				} else {
					setImageUrls([])
				}
			} catch (e) {
				setError(e.message)
			} finally {
				setLoading(false)
			}
		})()
	}, [issueId])

	// Fetch comments (simulate, replace with API call)
	useEffect(() => {
		// TODO: Replace with real API call
		setComments([
			{ user: "Alice", text: "This issue needs urgent attention!", date: "2025-09-20" },
			{ user: "Bob", text: "Any update on this?", date: "2025-09-22" }
		]);
	}, [issueId]);

	// Add comment handler
	const handleAddComment = () => {
		if (!commentInput.trim()) return;
		setCommentLoading(true);
		// Simulate API call
		setTimeout(() => {
			setComments(prev => [
				...prev,
				{ user: "You", text: commentInput, date: new Date().toLocaleDateString() }
			]);
			setCommentInput("");
			setCommentLoading(false);
		}, 500);
	};

	if (loading) return <LoadingSpinner text="Loading issue details..." size="large" fullScreen={true} />
	if (error) return <div className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 sm:p-6 md:p-8 text-red-400">{error}</div>
	if (!issue) return <div className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 sm:p-6 md:p-8 text-white">Issue not found</div>

	return (
		<section className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 sm:p-6 md:p-8 text-white">
			<div className="max-w-4xl mx-auto">
				{/* Back Button */}
				<div className="mb-6">
					<Link
						to="/liveissues"
						className="inline-flex items-center text-[#045c65] hover:text-[#067a85] transition-colors"
					>
						← Back to Live Issues
					</Link>
				</div>

				{/* Issue Details Card */}
				<div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700">
					{/* Header */}
					<div className="mb-6">
						<h1 className="text-2xl sm:text-3xl font-bold mb-2">{issue.title}</h1>
						<p className="text-gray-400 text-lg">{issue.description}</p>
					</div>

					{/* Issue Info Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						<div>
							<h3 className="text-lg font-semibold mb-3 text-[#045c65]">Issue Information</h3>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-gray-400">Status:</span>
									<span className={`px-2 py-1 rounded text-sm font-medium ${issue.status === 'resolved' ? 'bg-green-600 text-white' :
											issue.status === 'in_progress' ? 'bg-yellow-600 text-white' :
												issue.status === 'pending' ? 'bg-orange-600 text-white' :
													'bg-red-600 text-white'
										}`}>
										{issue.status?.replace('_', ' ').toUpperCase()}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-400">Category:</span>
									<span className="text-white">{issue.category}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-400">Severity:</span>
									<span className="text-white">{issue.severity}/5</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-400">Urgency:</span>
									<span className="text-white">{issue.urgency}%</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-400">Created:</span>
									<span className="text-white">
										{new Date(issue.$createdAt).toLocaleDateString()}
									</span>
								</div>
							</div>
						</div>

						{issue.confirmationFileId && (
							<div className="mt-4">
								<p className="text-gray-400 text-sm">✅ Proof of Resolution:</p>
								<img
									src={configService.getFileUrl(issue.confirmationFileId)}
									alt="Confirmation Proof"
									className="mt-2 rounded-lg border border-gray-700 max-h-64 object-cover"
								/>
							</div>
						)}


						{/* Location Info */}
						{(issue.lat && issue.lng) && (
							<div>
								<h3 className="text-lg font-semibold mb-3 text-[#045c65]">Location</h3>
								<div className="space-y-2">
									<div className="flex justify-between">
										<span className="text-gray-400">Latitude:</span>
										<span className="text-white">{issue.lat}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-400">Longitude:</span>
										<span className="text-white">{issue.lng}</span>
									</div>
									<div className="mt-3">
										<a
											href={`https://www.google.com/maps?q=${issue.lat},${issue.lng}`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center px-4 py-2 bg-[#045c65] hover:bg-[#067a85] text-white rounded-lg transition-colors"
										>
											📍 View on Google Maps
										</a>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Images Section */}
					{issue.fileIds && issue.fileIds.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {issue.fileIds.slice(0, 2).map((fileId, index) => (
                            <img
                              key={index}
                              src={`https://fra.cloud.appwrite.io/v1/storage/buckets/68c462d1002875b45ff9/files/${fileId}/view?project=68c4577700352125b60d`}
                              alt={`Issue image ${index + 1}`}
                              className="w-100 h-80 object-cover rounded border border-gray-600"
                              onError={(e) => {
                                e.target.src = `https://fra.cloud.appwrite.io/v1/storage/buckets/68c462d1002875b45ff9/files/${fileId}/download?project=68c4577700352125b60d`;
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

					{/* Urgency Bar */}
					<div className="mb-6">
						<h3 className="text-lg font-semibold mb-3 text-[#045c65]">Urgency Level</h3>
						<div className="w-full bg-gray-700 rounded-full h-3">
							<div
								className="h-3 rounded-full transition-all duration-500"
								style={{
									width: `${issue.urgency || 60}%`,
									backgroundColor: issue.urgency >= 80 ? '#ff4d4d' :
										issue.urgency >= 50 ? '#ffaa00' : '#2ecc71'
								}}
							></div>
						</div>
						<p className="text-sm text-gray-400 mt-2">
							{issue.urgency >= 80 ? 'High Priority' :
								issue.urgency >= 50 ? 'Medium Priority' : 'Low Priority'}
						</p>
					</div>
				{/* Comments Section */}
				<div className="bg-[#181818] mt-8 p-6 rounded-xl shadow border border-gray-700">
					<h3 className="text-lg font-semibold mb-4 text-[#045c65]">Comments</h3>
					<div className="space-y-4 mb-4">
						{comments.length === 0 ? (
							<p className="text-gray-400">No comments yet. Be the first to comment!</p>
						) : (
							comments.map((c, idx) => (
								<div key={idx} className="border-b border-gray-700 pb-2">
									<span className="font-bold text-[#067a85]">{c.user}</span>
									<span className="ml-2 text-gray-400 text-xs">{c.date}</span>
									<div className="mt-1 text-white">{c.text}</div>
								</div>
							))
						)}
					</div>
					<div className="flex gap-2 items-center">
						<input
							type="text"
							className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none"
							placeholder="Add a comment..."
							value={commentInput}
							onChange={e => setCommentInput(e.target.value)}
							disabled={commentLoading}
						/>
						<button
							onClick={handleAddComment}
							className="px-4 py-2 bg-[#045c65] hover:bg-[#067a85] text-white rounded-lg font-semibold transition-colors"
							disabled={commentLoading}
						>
							{commentLoading ? "Adding..." : "Add"}
						</button>
					</div>
				</div>
				</div>
			</div>
		</section>
	)
}

export default IssueDetail 