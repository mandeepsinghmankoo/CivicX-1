import React, { useState } from 'react';
import { LoadingSpinner } from '../components/Index';
import { Send, Copy, ThumbsUp, ThumbsDown, Lightbulb, Zap } from 'lucide-react';

function AISolutionEngine() {
  const [issueDescription, setIssueDescription] = useState('');
  const [issueCategory, setIssueCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [solutions, setSolutions] = useState(null);
  const [feedback, setFeedback] = useState({});

  const handleGenerateSolutions = async () => {
    if (!issueDescription.trim() || !issueCategory) {
      alert('Please provide issue description and category');
      return;
    }

    try {
      setIsLoading(true);
      // TODO: Connect to AI backend endpoint
      // const response = await fetch('/api/ai-solutions', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     description: issueDescription,
      //     category: issueCategory,
      //     location: userData?.location,
      //     userId: userData?.$id
      //   })
      // });
      // const data = await response.json();
      // setSolutions(data);

      // Mock AI-generated solutions for UI development
      setSolutions({
        issueId: Date.now(),
        description: issueDescription,
        category: issueCategory,
        generatedAt: new Date().toLocaleString(),
        solutions: [
          {
            id: 1,
            title: 'Immediate Action Plan',
            priority: 'High',
            timeline: '1-2 days',
            estimatedCost: '$5,000 - $8,000',
            steps: [
              'Deploy rapid assessment team to the location',
              'Conduct comprehensive damage evaluation',
              'Block affected area for public safety',
              'Begin emergency repair procedures'
            ],
            resources: ['2 trucks', '5 personnel', 'Safety equipment'],
            riskLevel: 'Medium',
            successRate: '87%',
            rationale: 'This approach prioritizes immediate safety while gathering detailed information for comprehensive repairs.'
          },
          {
            id: 2,
            title: 'Scheduled Maintenance Program',
            priority: 'Medium',
            timeline: '1-2 weeks',
            estimatedCost: '$12,000 - $15,000',
            steps: [
              'Schedule preventive maintenance cycle',
              'Coordinate with traffic management',
              'Deploy specialized repair equipment',
              'Monitor progress and adjust as needed'
            ],
            resources: ['4 trucks', '8 personnel', 'Specialized machinery'],
            riskLevel: 'Low',
            successRate: '94%',
            rationale: 'This comprehensive approach prevents future issues and provides better long-term value.'
          },
          {
            id: 3,
            title: 'Community-Driven Solution',
            priority: 'Low',
            timeline: '2-4 weeks',
            estimatedCost: '$3,000 - $6,000',
            steps: [
              'Organize community volunteer program',
              'Provide necessary tools and training',
              'Coordinate with local organizations',
              'Celebrate community impact'
            ],
            resources: ['1 supervisor', '15+ volunteers', 'Basic tools'],
            riskLevel: 'High',
            successRate: '65%',
            rationale: 'This builds community engagement while reducing costs, though with lower success probability.'
          }
        ],
        alternativeApproaches: [
          'Partner with local contractors for bulk discount',
          'Phase the repairs to spread costs over time',
          'Combine with nearby infrastructure projects'
        ],
        predictedOutcome: 'Early implementation of Solution 1 followed by Solution 2 recommended for optimal results.'
      });
    } catch (error) {
      console.error('Error generating solutions:', error);
      alert('Failed to generate solutions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (solutionId, type) => {
    setFeedback({
      ...feedback,
      [solutionId]: type
    });
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High') return 'bg-red-900/30 text-red-300 border-red-700';
    if (priority === 'Medium') return 'bg-orange-900/30 text-orange-300 border-orange-700';
    return 'bg-yellow-900/30 text-yellow-300 border-yellow-700';
  };

  const getRiskColor = (riskLevel) => {
    if (riskLevel === 'High') return 'text-red-400';
    if (riskLevel === 'Medium') return 'text-orange-400';
    return 'text-green-400';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <section className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">🤖</div>
            <h1 className="text-3xl sm:text-4xl font-bold">AI Solution Engine</h1>
          </div>
          <p className="text-gray-400">Get intelligent AI-powered solutions for civic issues</p>
        </div>

        {/* Input Section */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-700 mb-8">
          <h2 className="text-lg font-semibold mb-4">Describe Your Issue</h2>
          
          <div className="space-y-4">
            {/* Issue Category */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Issue Category</label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-[#045c65]"
              >
                <option value="">Select a category</option>
                <option value="road">Road Infrastructure</option>
                <option value="water">Water Management</option>
                <option value="power">Power & Utilities</option>
                <option value="safety">Public Safety</option>
                <option value="sanitation">Sanitation</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Issue Description */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Issue Description</label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the civic issue in detail. Include location, symptoms, urgency, and any other relevant information..."
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-[#045c65] min-h-[120px] resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                {issueDescription.length} / 1000 characters
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateSolutions}
              disabled={isLoading || !issueDescription.trim() || !issueCategory}
              className="w-full px-6 py-3 bg-[#045c65] hover:bg-[#067a85] disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              {isLoading ? 'Generating Solutions...' : 'Generate AI Solutions'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner text="AI is analyzing your issue and generating solutions..." size="large" />
          </div>
        )}

        {/* Solutions Display */}
        {solutions && !isLoading && (
          <div className="space-y-6">
            {/* Input Summary */}
            <div className="bg-gray-800/30 border border-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Analysis Summary</h3>
              <p className="text-gray-300 text-sm mb-2">{solutions.description}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Category: {solutions.category}</span>
                <span>Generated: {solutions.generatedAt}</span>
              </div>
            </div>

            {/* Solutions Cards */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Lightbulb size={28} className="text-[#067a85]" />
                Recommended Solutions
              </h2>

              {solutions.solutions.map((solution) => (
                <div
                  key={solution.id}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition"
                >
                  {/* Header */}
                  <div className={`p-6 border-b border-gray-700 ${getPriorityColor(solution.priority)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{solution.title}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-black/30">
                        Solution {solution.id}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>Priority: <strong>{solution.priority}</strong></span>
                      <span>Timeline: <strong>{solution.timeline}</strong></span>
                      <span>Cost: <strong>{solution.estimatedCost}</strong></span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-400">{solution.successRate}</div>
                        <div className="text-xs text-gray-400">Success Rate</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div className={`text-2xl font-bold ${getRiskColor(solution.riskLevel)}`}>
                          {solution.riskLevel}
                        </div>
                        <div className="text-xs text-gray-400">Risk Level</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-[#067a85]">{solution.resources.length}</div>
                        <div className="text-xs text-gray-400">Resources</div>
                      </div>
                    </div>

                    {/* Steps */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Implementation Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                        {solution.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Resources */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Required Resources:</h4>
                      <div className="flex flex-wrap gap-2">
                        {solution.resources.map((resource, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-xs bg-[#045c65]/30 border border-[#067a85] text-[#067a85] rounded-full"
                          >
                            {resource}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rationale */}
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-1">AI Rationale:</h4>
                      <p className="text-sm text-gray-300">{solution.rationale}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(solution, null, 2))}
                        className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy size={16} />
                        Copy Details
                      </button>
                      <button
                        onClick={() => handleFeedback(solution.id, 'helpful')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          feedback[solution.id] === 'helpful'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }`}
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <button
                        onClick={() => handleFeedback(solution.id, 'unhelpful')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          feedback[solution.id] === 'unhelpful'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }`}
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Alternative Approaches */}
            {solutions.alternativeApproaches && (
              <div className="bg-[#1a1a1a] border border-gray-700 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Alternative Approaches</h3>
                <ul className="space-y-2">
                  {solutions.alternativeApproaches.map((approach, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-[#067a85] flex-shrink-0"></div>
                      <span className="text-gray-300">{approach}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Predicted Outcome */}
            {solutions.predictedOutcome && (
              <div className="bg-gradient-to-r from-[#045c65]/20 to-[#067a85]/20 border border-[#067a85] p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Predicted Outcome</h3>
                <p className="text-gray-300">{solutions.predictedOutcome}</p>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={() => {
                setIssueDescription('');
                setIssueCategory('');
                setSolutions(null);
                setFeedback({});
              }}
              className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              Generate New Solutions
            </button>
          </div>
        )}

        {/* Empty State */}
        {!solutions && !isLoading && (
          <div className="bg-[#1a1a1a] border border-gray-700 p-12 rounded-xl text-center">
            <Zap size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">Describe an issue above and let the AI generate intelligent solutions</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default AISolutionEngine;
