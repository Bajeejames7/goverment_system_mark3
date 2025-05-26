import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "🇰🇪 Hello! I'm MIRA, your RMU Government System assistant. I can help you with document management, user registration, routing rules, and system navigation. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [position, setPosition] = useState(() => ({
    x: window.innerWidth - 88, // 64px button width + 24px margin from right
    y: window.innerHeight - 88  // 64px button height + 24px margin from bottom
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [wasUserDragged, setWasUserDragged] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
      return "Hello! 👋 I'm MIRA, your RMU Government System assistant. Welcome to the system! I'm here to help you navigate and use all the features effectively. What can I assist you with today?";
    }
    
    if (message.includes("help") || message.includes("how") || message.includes("guide")) {
      return "I can help you with:\n\n📄 Document Management\n• Upload and organize letters\n• Create folders and manage files\n• Track document status\n\n👥 User Administration\n• Register new users (Admin only)\n• Assign roles and permissions\n• Manage departments\n\n🔄 Automated Routing\n• Set up routing rules\n• Monitor document flow\n• Track delivery status\n\nWhat would you like to know more about?";
    }
    
    if (message.includes("document") || message.includes("upload") || message.includes("file")) {
      return "📄 To upload a document:\n\n1. Go to 'Letters' section\n2. Click 'Upload Letter' button\n3. Select your PDF or Word file\n4. Fill in title and reference\n5. Choose a folder\n6. Submit to upload\n\nYour document will get a verification code for security. Need help with anything specific?";
    }
    
    if (message.includes("user") || message.includes("register") || message.includes("account")) {
      return "👥 To register a new user (Admin only):\n\n1. Go to 'User Management' section\n2. Click 'Register New User'\n3. Enter user details\n4. Select role: Admin, Registry, or Officer\n5. Assign to department\n6. Set password\n7. Submit to create account\n\nOnly administrators can create new users. What else would you like to know?";
    }
    
    if (message.includes("routing") || message.includes("rule") || message.includes("automat")) {
      return "🔄 To create routing rules:\n\n1. Go to 'Routing' section\n2. Click 'Create Rule'\n3. Set source and target departments\n4. Define conditions (title, keywords, status)\n5. Set priority level\n6. Activate the rule\n\nDocuments matching your conditions will automatically route to the right department. Need help with specific conditions?";
    }
    
    if (message.includes("logo") || message.includes("kenya")) {
      return "🇰🇪 The system displays the official Republic of Kenya logo and serves the Department of Industry with government-grade security and compliance standards.";
    }

    if (message.includes("mira") || message.includes("name") || message.includes("who are you")) {
      return "I'm MIRA! 🤖 I'm your dedicated assistant for the RMU Government System. I'm here to help you with all aspects of document management, user administration, and system navigation. How can I assist you today?";
    }
    
    return "I'm MIRA, here to help with the RMU Government System! You can ask me about:\n• Document upload and management\n• User registration and roles\n• Automated routing setup\n• System navigation\n\nWhat specific topic interests you?";
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: getBotResponse(currentInput),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Keep button within screen bounds
    const maxX = window.innerWidth - 80; // button width + some padding
    const maxY = window.innerHeight - 80; // button height + some padding
    
    setPosition({
      x: Math.max(20, Math.min(newX, maxX)),
      y: Math.max(20, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setWasUserDragged(true); // Mark that user has manually moved the button
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Handle window resize to keep button visible and return to default if not user-dragged
  useEffect(() => {
    const handleResize = () => {
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;
      const defaultX = window.innerWidth - 88;
      const defaultY = window.innerHeight - 88;

      setPosition(prevPosition => {
        // If user never dragged the button, always return to default position
        if (!wasUserDragged) {
          return { x: defaultX, y: defaultY };
        }
        
        // If user dragged it, keep it within bounds but don't auto-return to default
        return {
          x: Math.max(20, Math.min(prevPosition.x, maxX)),
          y: Math.max(20, Math.min(prevPosition.y, maxY))
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [wasUserDragged]);

  if (!isOpen) {
    return (
      <div 
        className="fixed z-50"
        style={{ 
          position: 'fixed', 
          left: `${position.x}px`, 
          top: `${position.y}px`, 
          zIndex: 50,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <button
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            if (!isDragging) {
              setIsOpen(true);
            }
          }}
          className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 pulse-animation select-none"
          aria-label="Open RMU Assistant"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <Bot className="w-8 h-8" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-50"
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}
    >
      <div className="w-96 h-[500px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">MIRA Assistant</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                <div className="whitespace-pre-line">{message.text}</div>
                <div className={`text-xs mt-1 opacity-70 ${
                  message.sender === "user" ? "text-blue-100" : "text-gray-500"
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about the RMU system..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}