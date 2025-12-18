import { useSelector } from 'react-redux';
import { Container, Button } from '../components/Index';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import configService, { Query } from '../appwrite/config';

function Profile() {
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.userData);
  const computedRole = (userData?.role || userData?.profile?.role || 'citizen');
  const userRole = typeof computedRole === 'string' ? computedRole.toLowerCase() : 'citizen';

  const [stats, setStats] = useState({ issuesReported: 0, votesCast: 0, totalIssues: 0, pendingIssues: 0, resolvedIssues: 0 });

  const avatarInitial = (() => {
    const source = (userData?.name || userData?.profile?.name || userData?.email || 'User').trim();
    return source ? source.charAt(0).toUpperCase() : 'U';
  })();

  const profileInfo = {
    name: userData?.name || userData?.profile?.name || 'N/A',
    email: userData?.email || 'N/A',
    phone: userData?.profile?.phone || 'N/A',
    role: userRole.charAt(0).toUpperCase() + userRole.slice(1)
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData?.$id) return;

      try {
        if (userRole === 'citizen') {
          // Count issues reported by this user
          const issues = await configService.listIssues({ queries: [Query.equal('createdBy', userData.$id)] });
          const issuesReported = issues.length;

          // Count votes cast by this user
          const votesCast = await configService.getUserVotes(userData.$id).then(votes => votes.length);

          setStats({ issuesReported, votesCast, totalIssues: 0, pendingIssues: 0, resolvedIssues: 0 });
        } else if (userRole === 'official') {
          // For officials
          const allIssues = await configService.listIssues();
          const totalIssues = allIssues.length;
          const pendingIssues = allIssues.filter(issue => issue.status === 'pending').length;
          const resolvedIssues = allIssues.filter(issue => issue.status === 'resolved').length;

          setStats({ issuesReported: 0, votesCast: 0, totalIssues, pendingIssues, resolvedIssues });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [userData, userRole]);

  return (
    <div className='w-full py-8'>
      <Container>
        <div className='max-w-2xl mx-auto'>
          <div className='bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] rounded-3xl p-8 shadow-2xl'>
            <div className='text-center mb-8'>
              <h1 className='text-3xl md:text-4xl font-bold text-white mb-2'>My Profile</h1>
              <p className='text-gray-400'>Manage your account information</p>
            </div>

            <div className='flex flex-col items-center mb-8'>
              <div className='w-24 h-24 rounded-full bg-[#045c65] flex items-center justify-center text-white font-bold text-3xl mb-4'>
                {avatarInitial}
              </div>
              <h2 className='text-2xl font-semibold text-white'>{profileInfo.name}</h2>
              <p className='text-gray-400'>{profileInfo.role}</p>
            </div>

            <div className='space-y-6'>
              <div className='bg-[#1a1a1a] rounded-xl p-6 border border-gray-700'>
                <h3 className='text-xl font-semibold text-white mb-4'>Personal Information</h3>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-400 mb-1'>Full Name</label>
                    <p className='text-white text-lg'>{profileInfo.name}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-400 mb-1'>Email Address</label>
                    <p className='text-white text-lg'>{profileInfo.email}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-400 mb-1'>Phone Number</label>
                    <p className='text-white text-lg'>{profileInfo.phone}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-400 mb-1'>Account Type</label>
                    <p className='text-white text-lg'>{profileInfo.role}</p>
                  </div>
                </div>
              </div>

              {userRole === 'citizen' && (
                <div className='bg-[#1a1a1a] rounded-xl p-6 border border-gray-700'>
                  <h3 className='text-xl font-semibold text-white mb-4'>Citizen Activity</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-400'>{stats.issuesReported}</div>
                      <div className='text-sm text-gray-400'>Issues Reported</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-[#067a85]'>{stats.votesCast}</div>
                      <div className='text-sm text-gray-400'>Votes Cast</div>
                    </div>
                  </div>
                </div>
              )}

              {userRole === 'official' && (
                <div className='bg-[#1a1a1a] rounded-xl p-6 border border-gray-700'>
                  <h3 className='text-xl font-semibold text-white mb-4'>Official Activity</h3>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-400'>{stats.totalIssues}</div>
                      <div className='text-sm text-gray-400'>Total Issues</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-[#067a85]'>{stats.pendingIssues}</div>
                      <div className='text-sm text-gray-400'>Issues to Manage</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-[#067a85]'>{stats.resolvedIssues}</div>
                      <div className='text-sm text-gray-400'>Issues Resolved</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='mt-8 flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                onClick={() => navigate('/')}
                className="bg-[#045c65] hover:bg-[#067a85] text-white px-6 py-2 rounded-xl transition-colors"
              >
                Back to Home
              </Button>
              {userRole === 'citizen' && (
                <Button
                  onClick={() => navigate('/my-issues')}
                  className="bg-[#045c65] hover:bg-[#067a85] text-white px-6 py-2 rounded-xl transition-colors"
                >
                  View My Issues
                </Button>
              )}
              {userRole === 'official' && (
                <Button
                  onClick={() => navigate('/manage-issues')}
                  className="bg-[#045c65] hover:bg-[#067a85] text-white px-6 py-2 rounded-xl transition-colors"
                >
                  Manage Issues
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Profile;