import { useState } from "react";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm here to help you navigate the RMU system. How can I assist you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Mock bot response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: `I understand you're asking about "${inputValue}". This is a demo response. Full AI integration coming soon!`,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={toggleChat}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors"
      >
        <i className="fas fa-comment text-xl"></i>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">RMU Assistant</h3>
            <button 
              onClick={toggleChat}
              className="text-white hover:text-gray-200"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="h-64 p-4 overflow-y-auto border-b border-gray-200 dark:border-gray-700">
            {messages.map((message) => (
              <div key={message.id} className={`mb-4 ${message.isBot ? '' : 'text-right'}`}>
                <div className={`inline-block max-w-xs p-3 rounded-lg ${
                  message.isBot 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                    : 'bg-blue-600 text-white'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4">
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..." 
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-600 focus:border-blue-600"
              />
              <button 
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
