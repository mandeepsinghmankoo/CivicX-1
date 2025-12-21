import React, { useState, useRef, useEffect } from 'react';

const ASSISTANT_URL = 'http://127.0.0.1:8000/Interference/assistant/';
const ASSISTANT_UPLOAD_URL = 'http://127.0.0.1:8000/Interference/assistant/upload/';
const ASSISTANT_SUBMIT_URL = 'http://127.0.0.1:8000/Interference/assistant/submit/';

const AIChatbot = ({ setValue, openCamera, handleFileChange, handleSubmit, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [keepListening, setKeepListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Create a new assistant session when opened
    if (isOpen && !sessionId) {
      const id = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `sess_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      setSessionId(id);
      window.voiceAssistantSessionId = id;
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    // Clean up recognition on unmount
    return () => {
      setKeepListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Listen for issue submission events so assistant can announce and stop listening
    const onIssueSubmitted = (e) => {
      const issue = e?.detail;
      addAIMessage(`✅ Issue submitted successfully${issue && issue.title ? `: ${issue.title}` : ''}. It should now appear in My Issues.`);
      speakText(`Issue submitted successfully. It should now appear in My Issues.`);
      // stop continuous listening
      setKeepListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (err) {}
        setIsListening(false);
      }
    };
    window.addEventListener('issueSubmitted', onIssueSubmitted);
    return () => window.removeEventListener('issueSubmitted', onIssueSubmitted);
  }, []);

  const speakText = (text) => {
    try {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // ignore
    }
  };

  const createRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (e) => {
      const transcript = (e.results[0][0].transcript || '').trim();
      if (transcript) {
        addUserMessage(transcript);
        sendToAssistant(transcript);
      }
    };

    rec.onerror = (e) => {
      console.warn('Speech recognition error', e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      // Auto-restart if we should keep listening
      if (keepListening && isOpen) {
        try {
          // create a fresh instance to avoid some browser bugs
          const r2 = createRecognition();
          recognitionRef.current = r2;
          try { r2.start(); } catch (err) { console.warn('rec start failed on restart', err); }
        } catch (e) {
          console.warn('Could not restart recognition', e);
        }
      }
    };

    return rec;
  };

  const startListening = () => {
    // Start continuous recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addAIMessage('Speech recognition not supported in this browser.');
      return;
    }

    setKeepListening(true);
    // create and start
    const rec = createRecognition();
    if (!rec) return;
    recognitionRef.current = rec;
    try { rec.start(); } catch (e) { console.warn('rec start failed', e); }
  };

  const stopListening = () => {
    setKeepListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const sendToAssistant = async (text) => {
    if (!text) return;
    setIsProcessing(true);
    try {
      const payload = { message: text };
      if (sessionId) payload.session_id = sessionId;
      const res = await fetch(ASSISTANT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.reply) {
        addAIMessage(data.reply);
      }

      // Apply any immediate form set
      if (data.set && window.voiceAssistantAPI && typeof window.voiceAssistantAPI.fillFormField === 'function') {
        const { field, value } = data.set;
        window.voiceAssistantAPI.fillFormField(field, value);
        addAIMessage(`✅ Filled ${field} with ${String(value)}`);
      }

      // If assistant returned data (final form fields), pre-fill them
      if (data.data && typeof data.data === 'object') {
        const d = data.data;
        Object.keys(d).forEach((k) => {
          if (d[k] !== undefined && window.voiceAssistantAPI && typeof window.voiceAssistantAPI.fillFormField === 'function') {
            window.voiceAssistantAPI.fillFormField(k, String(d[k]));
            addAIMessage(`✅ Filled ${k} with ${String(d[k])}`);
          }
        });
      }

      // Handle actions
      if (data.action) {
        if (data.action === 'open_camera') {
          if (window.voiceAssistantAPI && typeof window.voiceAssistantAPI.triggerCamera === 'function') {
            window.voiceAssistantAPI.triggerCamera();
          }
        }
        if (data.action === 'upload_file') {
          if (window.voiceAssistantAPI && typeof window.voiceAssistantAPI.triggerFileUpload === 'function') {
            window.voiceAssistantAPI.triggerFileUpload();
          }
        }
        if (data.action === 'submit_form') {
          // If backend provided data, we already pre-filled above. Now submit.
          if (window.voiceAssistantAPI && typeof window.voiceAssistantAPI.submitForm === 'function') {
            window.voiceAssistantAPI.submitForm();
            addAIMessage('Submitting the form now...');
            speakText('Submitting the form now.');
            // Stop continuous listening - report finished
            setKeepListening(false);
            if (recognitionRef.current) {
              try { recognitionRef.current.stop(); } catch (err) {}
              setIsListening(false);
            }
          }
        }
        if (data.action === 'terminate' || data.action === 'close') {
          addAIMessage('Assistant terminated.');
          speakText('Assistant terminated.');
          // Close assistant UI and stop listening
          if (window.voiceAssistantAPI && typeof window.voiceAssistantAPI.closeAssistant === 'function') {
            window.voiceAssistantAPI.closeAssistant();
          }
          setKeepListening(false);
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (err) {}
            setIsListening(false);
          }
        }
      }

      return data;
    } catch (err) {
      console.error('Assistant error', err);
      addAIMessage('Sorry, I could not reach the assistant service.');
      speakText('Sorry, I could not reach the assistant service.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };



  // Function to add AI message
  const addAIMessage = (text) => {
    setMessages(prev => [...prev, { text, isAI: true, timestamp: Date.now() }]);
    // Speak the message aloud
    speakText(text);
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
      const welcome = "🎤 Hi! I'm your voice assistant. I'll help you fill out the issue form step by step. Click the microphone to start!";
      addAIMessage(welcome);
      // start listening automatically and keep mic on until flow completes
      startListening();
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
      closeAssistant: () => {
        setIsOpen(false);
        // fully stop listening when assistant closed
        stopListening();
      }
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
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (isListening) {
                    try { recognitionRef.current?.stop(); } catch (e) {}
                    setIsListening(false);
                  } else {
                    startListening();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isListening) {
                      try { recognitionRef.current?.stop(); } catch (err) {}
                      setIsListening(false);
                    } else {
                      startListening();
                    }
                  }
                }}
                className={`cursor-pointer w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                  isListening 
                    ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50'
                }`}
              >
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