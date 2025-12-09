import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import configService from '../appwrite/config';
import { LoadingSpinner } from '../components/Index';

function Leaderboard() {
  const userData = useSelector(state => state.auth.userData);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState({
    points: 0,
    rank: 0,
    issuesReported: 0,
    issuesResolved: 0,
    badges: []
  });
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    fetchUserStats();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const issues = await configService.listIssues();
      
      // Calculate points for each user
      const userPoints = {};
      const now = new Date();
      
      issues.forEach(issue => {
        const userId = issue.createdBy;
        if (!userPoints[userId]) {
          userPoints[userId] = {
            userId,
            points: 0,
            issuesReported: 0,
            issuesResolved: 0,
            verifiedIssues: 0,
            highSeverityIssues: 0
          };
        }

        // Filter by timeframe
        const issueDate = new Date(issue.$createdAt);
        const daysDiff = (now - issueDate) / (1000 * 60 * 60 * 24);
        
        if (timeframe === 'all' || 
            (timeframe === '30d' && daysDiff <= 30) ||
            (timeframe === '7d' && daysDiff <= 7)) {
          
          userPoints[userId].issuesReported++;
          
          // Base points for reporting
          let points = 10;
          
          // Bonus for verified issues
          if (issue.status === 'resolved') {
            points += 20;
            userPoints[userId].issuesResolved++;
          }
          
          // Bonus for high severity
          if (issue.severity >= 4) {
            points += 15;
            userPoints[userId].highSeverityIssues++;
          }
          
          // Bonus for verified reports
          if (issue.verified) {
            points += 10;
            userPoints[userId].verifiedIssues++;
          }
          
          // Category bonuses
          const categoryBonuses = {
            'Emergency': 25,
            'Sewer Overflow': 20,
            'Water Leak': 15,
            'Pothole': 10,
            'Streetlight': 8,
            'Garbage': 5
          };
          
          points += categoryBonuses[issue.category] || 5;
          
          userPoints[userId].points += points;
        }
      });

      // Convert to array and sort
      const leaderboardData = Object.values(userPoints)
        .sort((a, b) => b.points - a.points)
        .slice(0, 50);

      // Add rank and fetch user names
      const leaderboardWithNames = await Promise.all(
        leaderboardData.map(async (user, index) => {
          try {
            const userProfile = await configService.getUserProfileByUserId(user.userId);
            return {
              ...user,
              rank: index + 1,
              name: userProfile?.name || `User ${user.userId.slice(-6)}`,
              avatar: userProfile?.avatar || null
            };
          } catch (error) {
            return {
              ...user,
              rank: index + 1,
              name: `User ${user.userId.slice(-6)}`,
              avatar: null
            };
          }
        })
      );

      setLeaderboard(leaderboardWithNames);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!userData) return;
    
    try {
      const issues = await configService.listIssues();
      const userIssues = issues.filter(issue => issue.createdBy === userData.$id);
      
      let points = 0;
      let issuesReported = userIssues.length;
      let issuesResolved = userIssues.filter(issue => issue.status === 'resolved').length;
      let verifiedIssues = userIssues.filter(issue => issue.verified).length;
      let highSeverityIssues = userIssues.filter(issue => issue.severity >= 4).length;

      // Calculate points
      userIssues.forEach(issue => {
        let issuePoints = 10; // Base points
        
        if (issue.status === 'resolved') issuePoints += 20;
        if (issue.severity >= 4) issuePoints += 15;
        if (issue.verified) issuePoints += 10;
        
        const categoryBonuses = {
          'Emergency': 25,
          'Sewer Overflow': 20,
          'Water Leak': 15,
          'Pothole': 10,
          'Streetlight': 8,
          'Garbage': 5
        };
        
        issuePoints += categoryBonuses[issue.category] || 5;
        points += issuePoints;
      });

      // Calculate badges
      const badges = [];
      if (issuesReported >= 10) badges.push({ name: 'First Steps', icon: '🌱', description: 'Reported 10+ issues' });
      if (issuesReported >= 50) badges.push({ name: 'Active Citizen', icon: '🏆', description: 'Reported 50+ issues' });
      if (issuesResolved >= 5) badges.push({ name: 'Problem Solver', icon: '🔧', description: '5+ issues resolved' });
      if (highSeverityIssues >= 3) badges.push({ name: 'Emergency Hero', icon: '🚨', description: 'Reported 3+ high severity issues' });
      if (verifiedIssues >= 10) badges.push({ name: 'Trusted Reporter', icon: '✅', description: '10+ verified reports' });
      if (points >= 500) badges.push({ name: 'Civic Champion', icon: '👑', description: '500+ total points' });

      // Find user rank
      const allUsers = {};
      issues.forEach(issue => {
        const userId = issue.createdBy;
        if (!allUsers[userId]) {
          allUsers[userId] = { userId, points: 0 };
        }
        allUsers[userId].points += 10; // Simplified calculation for rank
      });
      
      const sortedUsers = Object.values(allUsers).sort((a, b) => b.points - a.points);
      const userRank = sortedUsers.findIndex(user => user.userId === userData.$id) + 1;

      setUserStats({
        points,
        rank: userRank || 0,
        issuesReported,
        issuesResolved,
        verifiedIssues,
        highSeverityIssues,
        badges
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏅';
    return '⭐';
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    if (rank <= 10) return 'text-blue-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <LoadingSpinner text="Loading leaderboard..." size="large" fullScreen={true} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">🏆 Civic Heroes Leaderboard</h1>
          <p className="text-gray-400">Top contributors making our city better</p>
        </div>

        {/* User Stats Card */}
        {userData && (
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 rounded-xl mb-8 border border-blue-700">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Your Civic Score</h2>
                <div className="flex items-center gap-4 text-lg">
                  <span className="text-3xl font-bold text-yellow-400">{userStats.points}</span>
                  <span className="text-gray-300">points</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300">Rank #{userStats.rank}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">{userStats.issuesReported}</div>
                  <div className="text-sm text-gray-300">Reported</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{userStats.issuesResolved}</div>
                  <div className="text-sm text-gray-300">Resolved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{userStats.verifiedIssues || 0}</div>
                  <div className="text-sm text-gray-300">Verified</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{userStats.highSeverityIssues || 0}</div>
                  <div className="text-sm text-gray-300">High Priority</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges */}
        {userData && userStats.badges.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">🏅 Your Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {userStats.badges.map((badge, index) => (
                <div key={index} className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="font-semibold text-sm mb-1">{badge.name}</div>
                  <div className="text-xs text-gray-400">{badge.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold">Top Civic Heroes</h3>
          </div>
          
          <div className="divide-y divide-gray-700">
            {leaderboard.map((user, index) => (
              <div 
                key={user.userId} 
                className={`p-4 flex items-center justify-between hover:bg-gray-700 transition-colors ${
                  user.userId === userData?.$id ? 'bg-blue-900/30 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getRankIcon(user.rank)}</span>
                    <span className={`text-xl font-bold ${getRankColor(user.rank)}`}>
                      #{user.rank}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-lg font-bold">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-gray-400">
                        {user.issuesReported} issues • {user.issuesResolved} resolved
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">{user.points}</div>
                  <div className="text-sm text-gray-400">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Earn Points */}
        <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">💰 How to Earn Points</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Report an issue</span>
                <span className="text-green-400 font-semibold">+10 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Issue gets resolved</span>
                <span className="text-green-400 font-semibold">+20 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">High severity issue</span>
                <span className="text-green-400 font-semibold">+15 pts</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Verified report</span>
                <span className="text-green-400 font-semibold">+10 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Emergency category</span>
                <span className="text-green-400 font-semibold">+25 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Sewer/Water issues</span>
                <span className="text-green-400 font-semibold">+15-20 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
