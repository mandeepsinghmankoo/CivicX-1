import React, { useState } from 'react';

const AIChatbot = ({ setValue, openCamera, handleFileChange, handleSubmit, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to add AI message
  const addAIMessage = (text) => {
    setMessages(prev => [...prev, { text, isAI: true, timestamp: Date.now() }]);
  };

  // Function to add user message
  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { text, isAI: false, timestamp: Date.now() }]);
  };

  // Function to fill form field (called by AI backend)
  const fillFormField = (field, value) => {
    setValue(field, value);
    console.log(`AI filled ${field}: ${value}`);
  };

  // Function to trigger camera (called by Python backend)
  const triggerCamera = () => {
    openCamera();
    addAIMessage("📸 Camera opened! You can now capture photos.");
  };

  // Function to trigger file upload (called by Python backend)
  const triggerFileUpload = () => {
    document.querySelector('input[type="file"]')?.click();
    addAIMessage("📁 Please select files to upload.");
  };

  // Function to submit form (called by Python backend)
  const submitForm = () => {
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.click();
      addAIMessage("✅ Form submitted successfully!");
    }
  };

  const startVoiceAssistant = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      addAIMessage("🎤 Hi! I'm your voice assistant. I'll help you fill out the issue form step by step. Click the microphone to start!");
    }
  };

  // Expose functions globally for Python backend integration
  React.useEffect(() => {
    window.voiceAssistantAPI = {
      addAIMessage,
      addUserMessage,
      fillFormField,
      triggerCamera,
      triggerFileUpload,
      submitForm,
      setListening: setIsListening,
      setProcessing: setIsProcessing,
      openAssistant: () => setIsOpen(true),
      closeAssistant: () => setIsOpen(false)
    };
  }, []);

  return (
    <>
      {/* Floating Voice Assistant Button */}
      <button
        onClick={startVoiceAssistant}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl z-[9999] transition-all transform hover:scale-110 animate-pulse"
      >
        🎤
      </button>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl z-[9999] flex flex-col border border-purple-500">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="text-white font-semibold">🎤 Voice Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-300 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow-lg ${
                    msg.isAI
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-2xl text-sm animate-pulse">
                  🤖 Processing...
                </div>
              </div>
            )}
          </div>

          {/* Voice Controls */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                isListening 
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50'
              }`}>
                {isListening ? '🔴' : '🎤'}
              </div>
            </div>
            <p className="text-center text-gray-400 text-xs mt-2">
              {isListening ? 'Listening...' : 'Click microphone to speak'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;