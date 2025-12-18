import '../App.css'
import Button from '../components/Button'
import { LoadingSpinner } from '../components/Index'
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { databases, DATABASE_ID, ISSUE_COLLECTION_ID, Query} from "../appwrite/config";
import configService from "../appwrite/config";
import AnalyticsDashboard from './AnalyticsDashboard';
import Leaderboard from './Leaderboard';
import WorkerApp from './WorkerApp';
import HomeVoiceAssistant from '../components/HomeVoiceAssistant';

function Home() {
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth.status);
  const userData = useSelector((state) => state.auth.userData);
  const userRole = userData?.role || 'citizen';

  const [issues, setIssues] = useState([]);
  const [query, setQuery] = useState("");
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [votedIssues, setVotedIssues] = useState(new Set());
  const [voteCounts, setVoteCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Fetch issues from both collections
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setIsLoading(true);
        const res = await databases.listDocuments(DATABASE_ID, ISSUE_COLLECTION_ID, [
          Query.orderDesc("$createdAt")
        ]);
      
        console.log("Issues:", res.documents);
        console.log("First issue fileIds:", res.documents[0]?.fileIds);
        console.log("All issue fields:", res.documents[0] ? Object.keys(res.documents[0]) : 'No issues');
      
        const mapped = res.documents.map((doc) => ({
          id: doc.$id,
          title: doc.title,
          status: doc.status,
          severity: doc.severity || 3,
          urgency: doc.urgency || (doc.severity ? (doc.severity * 20) : 60), // Use urgency if available, otherwise map severity (1-5) to urgency (20-100)
          fileIds: doc.fileIds || [], // Include fileIds for image previews
          description: doc.description,
          category: doc.category,
          lat: doc.lat,
          lng: doc.lng,
          votes: doc.votes || 0
        }));
      
        setIssues(mapped);
        
        // Fetch vote counts for each issue
        const voteCountsData = {};
        for (const issue of mapped) {
          try {
            const count = await configService.getVoteCount(issue.id);
            voteCountsData[issue.id] = count;
          } catch (error) {
            console.error(`Error fetching vote count for issue ${issue.id}:`, error);
            voteCountsData[issue.id] = 0;
          }
        }
        setVoteCounts(voteCountsData);
      
      } catch (error) {
        console.error("❌ Error fetching issues:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // 🔹 Fetch user's votes when authenticated
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (authStatus && userData?.$id) {
        try {
          const userVotes = await configService.getUserVotes(userData.$id);
          setVotedIssues(new Set(userVotes));
        } catch (error) {
          console.error("Error fetching user votes:", error);
        }
      }
    };

    fetchUserVotes();
  }, [authStatus, userData]);

  // 🔍 Search handler - Search across all issue fields
  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setFilteredIssues([]);
    } else {
      const searchTerm = value.toLowerCase();
      const results = issues.filter(issue => {
        // Search in title
        if (issue.title?.toLowerCase().includes(searchTerm)) return true;
        // Search in description
        if (issue.description?.toLowerCase().includes(searchTerm)) return true;
        // Search in category
        if (issue.category?.toLowerCase().includes(searchTerm)) return true;
        // Search in status
        if (issue.status?.toLowerCase().includes(searchTerm)) return true;
        // Search in urgency level
        if (issue.urgency?.toString().includes(searchTerm)) return true;
        // Search in severity level
        if (issue.severity?.toString().includes(searchTerm)) return true;
        
        return false;
      });
      setFilteredIssues(results);
    }
  };

  const limitedIssues = issues.slice(0, 3);

  // Function to determine range color based on urgency
  const getUrgencyColor = (urgency) => {
    if (urgency >= 80) return "#ff4d4d"; // Red for high urgency
    if (urgency >= 50) return "#ffaa00"; // Orange for medium urgency
    return "#2ecc71"; // Green for low urgency
  };

  const handleVote = async (issueId, e) => {
    e.stopPropagation(); // Prevent navigation when voting
    if (!authStatus || !userData?.$id) {
      alert('Please log in to vote');
      return;
    }
    
    try {
      const result = await configService.voteForIssue(issueId, userData.$id);
      
      // Update local state
      setVotedIssues(prev => {
        const newVoted = new Set(prev);
        if (result.voted) {
          newVoted.add(issueId);
        } else {
          newVoted.delete(issueId);
        }
        return newVoted;
      });
      
      // Update vote count
      setVoteCounts(prev => ({
        ...prev,
        [issueId]: result.voteCount
      }));
      
      console.log(`Vote ${result.voted ? 'added' : 'removed'} for issue ${issueId}. New count: ${result.voteCount}`);
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="w-full h-screen relative">
        {/* Desktop Background Image */}
        <div
          className="absolute top-0 right-0 h-full w-[600px] z-0 hidden md:block"
          style={{
            backgroundImage: 'url(/bg-home.png)',
            backgroundSize: '500px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right',
            filter: 'grayscale(20%) brightness(0.8)',
            opacity: 0.4,
            marginRight: '100px'
          }}
        ></div>

        {/* Mobile Background Image - Centered */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 md:hidden"
          style={{
            backgroundImage: 'url(/bg-home.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            filter: 'grayscale(30%) brightness(0.7)',
            opacity: 0.3,
            width: '300px',
            height: '300px'
          }}
        ></div>

        <div className='w-full md:w-5/6 p-4 md:p-30 relative z-10'>
          <div className='text-2xl sm:text-3xl md:text-4xl lg:text-6xl text-white font-bold leading-tight'>
            Empowering Citizens, Transforming Communities.
          </div>

          {/* 🔎 Search bar */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search Issues in your Area... 🔍"
              className="w-full md:w-1/2 max-w-2xl p-3 md:p-4 mt-8 rounded-full border-3 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-lg md:text-2xl bg-transparent"
            />

            {/* 🔽 Suggestions dropdown */}
            {query && (
              <div className="absolute mt-2 w-full md:w-1/2 max-w-2xl bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                {(authStatus ? filteredIssues : filteredIssues.slice(0, 3)).length > 0 ? (
                  (authStatus ? filteredIssues : filteredIssues.slice(0, 3)).map((issue) => (
                    <div
                      key={issue.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                      onClick={() => authStatus ? navigate(`/issues/${issue.id}`) : navigate('/login')}
                    >
                      {issue.title}
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-2 text-gray-500">No results found</p>
                )}
                {!authStatus && (
                  <div className="px-4 py-2 bg-[#045c65]/20 text-sm text-[#067a85]">
                    🔒 Log in to view more results
                  </div>
                )}
              </div>
            )}
          </div>

          <div className='mt-7 flex flex-col sm:flex-row sm:space-x-4 md:space-x-5 space-y-4 sm:space-y-0'>
            {(!authStatus || userRole === 'citizen') && (
              <Button
                onClick={() => navigate("/repoissue")}
                type="submit"
                className="w-full sm:w-auto md:w-1/4 text-lg sm:text-xl font-bold py-3 md:py-4 px-6 md:px-8 hover:text-black transition-all duration-300 rounded-3xl text-white bg-[#045c65]"
              >
                Report an Issue
                <div className='font-light text-xs'>(for Citizens)</div>
              </Button>
            )}
            {(!authStatus || userRole === 'official') && (
              <Button
                onClick={() => authStatus ? navigate("/liveissues") : navigate("/login")}
                type="submit"
                className="w-full sm:w-auto md:w-1/4 text-lg sm:text-xl font-bold py-3 md:py-4 px-6 md:px-8 hover:text-[#bfe9ed] transition-all duration-300 rounded-3xl text-white border-2"
              >
                Explore Issues
                <div className='font-light text-xs'>(for Officials)</div>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Live Issues Preview Section */}
      <section className="text-white py-6 px-4 md:px-8 mx-2 md:mx-30 bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] rounded-3xl my-5">
        {authStatus ? (
          <div> 
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
              <div className="text-xl sm:text-2xl md:text-4xl font-bold">Live Issue Dashboard</div>
              {issues.length > 3 && (
                <Link to="/liveissues" className="text-[#067a85] hover:underline text-sm sm:text-base">
                  See More →
                </Link>
              )}
            </div>

            {isLoading ? (
              <LoadingSpinner text="Loading issues..." size="medium" />
            ) : issues.length === 0 ? (
              <p className="text-gray-400">No issues found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
              >
                {limitedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => navigate(`/issues/${issue.id}`)}
                    className="bg-[#1a1a1a] p-4 md:p-6 rounded-xl shadow-lg border border-gray-700 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold">{issue.title}</h3>
                    
                    {/* Image Preview */}
                    {issue.fileIds && issue.fileIds.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {issue.fileIds.slice(0, 2).map((fileId, index) => (
                            <img
                              key={index}
                              src={`https://fra.cloud.appwrite.io/v1/storage/buckets/68c462d1002875b45ff9/files/${fileId}/view?project=68c4577700352125b60d`}
                              alt={`Issue image ${index + 1}`}
                              className="w-12 h-12 object-cover rounded border border-gray-600"
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
                    
                    <p className="mt-2 text-gray-400">Status: {issue.status}</p>
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-1">Urgency</p>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full transition-all duration-500" 
                          style={{
                            width: `${issue.urgency}%`,
                            backgroundColor: getUrgencyColor(issue.urgency)
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Voting Section - Only for citizens */}
                    {userRole === 'citizen' && (
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={(e) => handleVote(issue.id, e)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                            votedIssues.has(issue.id)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <span>👍</span>
                          <span>{votedIssues.has(issue.id) ? 'Voted' : 'Vote'}</span>
                        </button>
                        <span className="text-xs text-gray-400">
                          {voteCounts[issue.id] > 0 ? `${voteCounts[issue.id]} vote${voteCounts[issue.id] !== 1 ? 's' : ''}` : 'No votes yet'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 md:py-10">
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-4">Live Issue Dashboard</h2>
            <p className="text-gray-400 mb-6 text-sm sm:text-base">
              🔒 Please{" "}
              <Link to="/login" className="text-[#067a85] underline">
                Log in
              </Link>{" "}
              to view live issues.
            </p>
          </div>
        )}
      </section>

      {/* Role-Specific Features Section */}
      {authStatus && (
        <section className="text-white py-6 px-4 md:px-8 mx-2 md:mx-30 bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] rounded-3xl my-5">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              {userRole === 'official' ? '🔧 Official Dashboard' : '👥 Citizen Features'}
            </h2>
            <p className="text-gray-400">
              {userRole === 'official' 
                ? 'Advanced tools for city management and issue resolution'
                : 'Engage with your community and track your civic impact'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRole === 'official' ? (
              // Official Features
              <>
                <div 
                  onClick={() => navigate('/analytics')}
                  className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700 hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Real-time heatmaps, trend analysis, and city-wide insights
                  </p>
                  <div className="text-[#067a85] text-sm font-medium">View Analytics →</div>
                </div>

                <div 
                  onClick={() => navigate('/worker-app')}
                  className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700 hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="text-4xl mb-4">🔧</div>
                  <h3 className="text-xl font-semibold mb-2">Worker App</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    AR navigation and issue resolution tools for field workers
                  </p>
                  <div className="text-[#067a85] text-sm font-medium">Open Worker App →</div>
                </div>

                <div 
                  onClick={() => navigate('/leaderboard')}
                  className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700 hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-xl font-semibold mb-2">Civic Heroes</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Track top contributors and community engagement
                  </p>
                  <div className="text-[#067a85] text-sm font-medium">View Leaderboard →</div>
                </div>
              </>
            ) : (
              // Citizen Features
              <>
                <div 
                  onClick={() => navigate('/leaderboard')}
                  className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700 hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-xl font-semibold mb-2">Civic Heroes</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Earn points, unlock badges, and climb the leaderboard
                  </p>
                  <div className="text-[#067a85] text-sm font-medium">View Leaderboard →</div>
                </div>

                <div 
                  onClick={() => navigate('/predictive-intelligence')}
                  className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700 hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="text-xl font-semibold mb-2">Predictive Intelligence</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    AI predicts where issues will occur before they happen using ML models
                  </p>
                  <div className="text-[#067a85] text-sm font-medium">View Predictions →</div>
                </div>

                <div 
                  onClick={() => navigate('/ai-solution-engine')}
                  className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700 hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-xl font-semibold mb-2">AI Solution Engine</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Get AI-generated solutions and smart recommendations for civic issues
                  </p>
                  <div className="text-[#067a85] text-sm font-medium">Generate Solutions →</div>
                </div>
              </>
            )}
          </div>

        </section>
      )}

      {/* Voice Assistant */}
      <HomeVoiceAssistant />
    </>
  )
}

export default Home;
