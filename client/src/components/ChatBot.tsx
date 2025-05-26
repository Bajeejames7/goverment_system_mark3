import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Loader2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "🇰🇪 Welcome to the RMU Government System! I'm your intelligent assistant here to help you navigate document management, user administration, automated routing, and more. What can I help you accomplish today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, isMinimized]);

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

    // Simulate realistic typing delay
    const typingTime = Math.min(currentInput.length * 50 + 1000, 3000);
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: getBotResponse(currentInput),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, typingTime);
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Greeting responses
    if (message.includes("hello") || message.includes("hi") || message.includes("hey") || message.includes("good")) {
      return "Hello! 👋 Welcome to the RMU Government System. I'm here to help you navigate and use all the features effectively. What specific task can I assist you with today?";
    }
    
    // Thank you responses
    if (message.includes("thank") || message.includes("thanks")) {
      return "You're very welcome! 😊 I'm always here to help you with the RMU system. Feel free to ask me anything else you need assistance with!";
    }
    
    // Help and general assistance
    if (message.includes("help") || message.includes("how") || message.includes("guide") || message.includes("what can you")) {
      return "I can assist you with:\n\n📄 **Document Management**\n• Upload and organize letters\n• Create folders and manage files\n• Track document status and verification\n\n👥 **User Administration**\n• Register new system users\n• Assign roles and permissions\n• Manage department access\n\n🔄 **Automated Routing**\n• Set up routing rules\n• Monitor document flow\n• Track delivery status\n\n🧭 **System Navigation**\n• Dashboard overview\n• Feature explanations\n• Best practices\n\nJust ask me something like \"How do I upload a document?\" or \"How do I create a user?\" and I'll guide you step by step!";
    }
    
    // Document management
    if (message.includes("document") || message.includes("file") || message.includes("letter") || message.includes("upload") || message.includes("pdf") || message.includes("word")) {
      if (message.includes("upload") || message.includes("add") || message.includes("create") || message.includes("new")) {
        return "📄 **How to Upload a Document:**\n\n1. **Navigate** to the 'Letters' section in your dashboard\n2. **Click** the 'Upload Letter' button (+ icon)\n3. **Select** your file (PDF or Word document)\n4. **Fill in** the required details:\n   • Document title\n   • Reference number\n   • Select appropriate folder\n5. **Review** the information\n6. **Submit** - the system will generate a verification code\n\n✅ Your document will be securely stored and trackable!\n\n💡 **Pro tip:** Use descriptive titles to make documents easier to find later.";
      } else if (message.includes("organize") || message.includes("folder")) {
        return "📁 **Document Organization:**\n\n**Folders help you categorize documents by:**\n• Department (Finance, Legal, Admin)\n• Document type (Contracts, Reports, Memos)\n• Project or initiative\n• Date ranges\n\n**To create a folder:**\n1. Go to 'Folders' section\n2. Click 'Create Folder'\n3. Name it descriptively\n4. Assign to appropriate department\n\n**Best practices:**\n• Use clear, consistent naming\n• Create subfolders for large categories\n• Regular cleanup and archiving\n\nNeed help with a specific organization strategy?";
      } else {
        return "📄 **Document Management Features:**\n\n🔍 **Preview:** View PDFs and Word docs directly\n🔒 **Security:** Each document gets a unique verification code\n📂 **Organization:** Use folders to categorize documents\n📊 **Tracking:** Monitor document status and routing\n🔄 **Routing:** Automatic distribution based on rules\n📝 **Metadata:** Add titles, references, and descriptions\n\n**Supported formats:** PDF, DOC, DOCX\n**File size limit:** Up to 50MB per document\n\nWhat specific aspect of document management interests you?";
      }
    }
    
    // User management and registration
    if (message.includes("user") || message.includes("register") || message.includes("account") || message.includes("admin") || message.includes("role")) {
      if (message.includes("register") || message.includes("create") || message.includes("add") || message.includes("new")) {
        return "👥 **User Registration Process (Admin Only):**\n\n**Prerequisites:**\n✅ You must have Administrator privileges\n\n**Steps to register a user:**\n1. **Navigate** to 'User Management' section\n2. **Click** 'Register New User' button\n3. **Enter** user details:\n   • Full name\n   • Email address\n   • Department\n   • Position/Title\n4. **Select** user role:\n   • 👑 Admin: Full system access\n   • 📋 Registry: Document processing\n   • 👔 Officer: Basic operations\n5. **Set** initial password\n6. **Submit** to create account\n\n📧 The new user will receive login credentials via email.\n\nNeed help understanding role permissions?";
      } else if (message.includes("role") || message.includes("permission")) {
        return "🎭 **User Roles & Permissions:**\n\n👑 **Administrator Role:**\n• Full system access\n• User management\n• System configuration\n• All document operations\n• Routing rule creation\n\n📋 **Registry Officer Role:**\n• Document upload and processing\n• Folder management\n• Document verification\n• Basic routing operations\n\n👔 **Officer Role:**\n• Document viewing\n• Basic file operations\n• Department-specific access\n• Read-only for most features\n\n🏢 **Department Assignment:**\nUsers can only access documents and operations within their assigned department (unless they're Admin).\n\nWhich role would you like to know more about?";
      } else {
        return "👥 **User Management System:**\n\n🔐 **Authentication:** Email-based secure login\n🏢 **Department Structure:** Users assigned to specific departments\n🎭 **Role-Based Access:** Three levels of permissions\n📊 **Activity Tracking:** Monitor user actions\n🔒 **Security:** Password policies and session management\n\n**User lifecycle:**\n• Registration (Admin only)\n• Role assignment\n• Department allocation\n• Active monitoring\n• Account management\n\n**Only administrators can create new accounts** to maintain security.\n\nWhat specific user management task can I help you with?";
      }
    }
    
    // Routing and automation
    if (message.includes("routing") || message.includes("automat") || message.includes("rule") || message.includes("workflow") || message.includes("flow")) {
      if (message.includes("create") || message.includes("setup") || message.includes("add") || message.includes("new")) {
        return "🔄 **Creating Automated Routing Rules:**\n\n**Step-by-step process:**\n1. **Go to** 'Routing' section in dashboard\n2. **Click** 'Create Rule' button\n3. **Configure rule details:**\n   • Rule name (descriptive)\n   • Source department\n   • Target department\n   • Priority level (0-10)\n\n4. **Set routing conditions:**\n   • Title contains keywords\n   • Reference number patterns\n   • Document content keywords\n   • Status requirements\n\n5. **Test and activate** the rule\n\n**Example rule:**\n• Name: \"Legal Contracts\"\n• Condition: Title contains \"contract\"\n• Route: From Admin → To Legal\n• Priority: 8 (high)\n\nWould you like help setting up a specific routing scenario?";
      } else if (message.includes("monitor") || message.includes("track") || message.includes("activity")) {
        return "📊 **Routing Monitoring & Analytics:**\n\n**Real-time Dashboard shows:**\n• 📈 Documents routed today\n• ⏱️ Average routing time\n• 🎯 Active routing rules\n• 📋 Pending deliveries\n\n**Activity Tracking includes:**\n• Which documents were routed\n• When routing occurred\n• Which rules triggered\n• Delivery confirmations\n• Any routing failures\n\n**Performance Metrics:**\n• Success rate by department\n• Most frequently used rules\n• Bottlenecks and delays\n\n**Access the monitoring:**\nGo to Routing → Activity tab for detailed logs and statistics.\n\nWhat specific routing metrics are you interested in tracking?";
      } else {
        return "🔄 **Automated Document Routing:**\n\n**How it works:**\n• Documents are automatically analyzed\n• Routing rules check content and metadata\n• Matching documents are instantly forwarded\n• Receiving departments get notifications\n\n**Benefits:**\n⚡ **Speed:** Instant document distribution\n🎯 **Accuracy:** Rule-based routing eliminates errors\n📊 **Tracking:** Full audit trail of all movements\n⏰ **Efficiency:** Reduces manual processing time\n\n**Smart Features:**\n• Keyword detection in document content\n• Pattern matching for reference numbers\n• Priority-based processing\n• Multi-department routing\n\nThis system can save hours of manual work daily! What routing challenge would you like to solve?";
      }
    }
    
    // Navigation and dashboard
    if (message.includes("navigate") || message.includes("dashboard") || message.includes("menu") || message.includes("where") || message.includes("find")) {
      return "🧭 **System Navigation Guide:**\n\n🏠 **Dashboard Home**\n• Quick overview and statistics\n• Recent activity summary\n• Shortcut buttons to key features\n\n📁 **Main Sections:**\n• **Folders:** Organize documents by category\n• **Letters:** Upload and manage documents\n• **Users:** Register and manage accounts (Admin)\n• **Routing:** Set up automated workflows\n• **Reports:** View system analytics\n\n⚙️ **User Interface:**\n• **Sidebar:** Main navigation menu\n• **Top bar:** User profile and theme toggle\n• **Breadcrumbs:** Track your current location\n• **Search:** Find documents quickly\n\n💡 **Navigation Tips:**\n• Click the logo to return to dashboard\n• Use keyboard shortcuts (Ctrl+/ for search)\n• Bookmark frequently used sections\n\nWhich section would you like me to explain in detail?";
    }
    
    // Login and access
    if (message.includes("login") || message.includes("access") || message.includes("portal") || message.includes("password") || message.includes("sign in")) {
      return "🔐 **System Access & Login:**\n\n**Three Access Portals:**\n\n🛡️ **Administrator Portal**\n• Complete system control\n• User management capabilities\n• Advanced configuration options\n\n📋 **Registry Portal**\n• Document processing workflows\n• Verification and approval tasks\n• Folder and file management\n\n👔 **Officer Portal**\n• Document viewing and basic operations\n• Department-specific access\n• Read-only for sensitive areas\n\n**Login Process:**\n1. Choose appropriate portal\n2. Enter your assigned email\n3. Use your secure password\n4. Access role-specific dashboard\n\n**Security Features:**\n• Session timeouts for security\n• Password complexity requirements\n• Activity logging\n\n**Trouble logging in?** Contact your system administrator for password reset or account issues.";
    }
    
    // Kenya/Government specific
    if (message.includes("logo") || message.includes("kenya") || message.includes("government") || message.includes("official")) {
      return "🇰🇪 **Government System Standards:**\n\n**Official Compliance:**\n🏛️ Republic of Kenya official branding\n🏢 Department of Industry specifications\n📋 Government workflow compliance\n🔒 National security standards\n\n**Key Features:**\n• **Audit Trails:** Complete accountability\n• **Data Security:** Government-grade encryption\n• **Access Control:** Strict permission systems\n• **Document Integrity:** Verification codes\n• **Compliance Reporting:** Regular audits\n\n**Quality Assurance:**\n✅ Meets government IT standards\n✅ Follows official procedures\n✅ Maintains data sovereignty\n✅ Ensures transparency\n\nThis system upholds the highest standards for government document management and maintains full compliance with national requirements.";
    }
    
    // Troubleshooting
    if (message.includes("error") || message.includes("problem") || message.includes("issue") || message.includes("not working") || message.includes("broken")) {
      return "🔧 **Troubleshooting Assistant:**\n\n**Common Issues & Solutions:**\n\n📄 **Document Problems:**\n• ❌ Upload fails → Check file format (PDF/Word only)\n• ❌ File too large → Compress or split document\n• ❌ Permission denied → Verify user role permissions\n\n👥 **User Management Issues:**\n• ❌ Can't create users → Ensure admin privileges\n• ❌ Login fails → Check email/password format\n• ❌ Access denied → Verify role assignments\n\n🔄 **Routing Problems:**\n• ❌ Rules don't trigger → Check condition syntax\n• ❌ Wrong department → Verify department names\n• ❌ Not activating → Ensure rule is enabled\n\n🌐 **System Issues:**\n• ❌ Page won't load → Refresh browser\n• ❌ Slow performance → Clear browser cache\n• ❌ Features missing → Check user permissions\n\n**Need specific help?** Describe your exact issue and I'll provide detailed troubleshooting steps!";
    }
    
    // Quick actions and shortcuts
    if (message.includes("quick") || message.includes("shortcut") || message.includes("fast") || message.includes("tips")) {
      return "⚡ **Quick Actions & Pro Tips:**\n\n**Keyboard Shortcuts:**\n• `Ctrl + /` → Open search\n• `Ctrl + U` → Upload document\n• `Ctrl + N` → Create new folder\n• `Alt + H` → Return to dashboard\n\n**Time-Saving Features:**\n🚀 **Bulk Operations:** Select multiple documents\n📋 **Templates:** Save common document formats\n🔍 **Quick Search:** Find anything instantly\n📌 **Favorites:** Pin frequently used folders\n\n**Power User Tips:**\n• Use descriptive file names\n• Set up routing rules early\n• Regular system cleanup\n• Bookmark important sections\n• Use folder hierarchies effectively\n\n**Mobile Access:**\nThe system is mobile-responsive - access from any device!\n\nWhat specific workflow would you like to optimize?";
    }
    
    // Security and privacy
    if (message.includes("security") || message.includes("safe") || message.includes("privacy") || message.includes("secure")) {
      return "🔒 **Security & Privacy Features:**\n\n**Document Security:**\n• 🔐 Unique verification codes\n• 📝 Complete audit trails\n• 🏢 Department-based access control\n• 🔒 Encrypted file storage\n\n**User Security:**\n• 👤 Role-based permissions\n• 🔑 Secure password requirements\n• ⏰ Session timeout protection\n• 📊 Activity monitoring\n\n**System Security:**\n• 🛡️ Government-grade encryption\n• 🏛️ Compliance with national standards\n• 📋 Regular security audits\n• 🔍 Intrusion detection\n\n**Privacy Protection:**\n• Data stays within Kenya\n• No unauthorized external access\n• User actions are logged\n• Privacy by design principles\n\n**Best Practices:**\n• Never share login credentials\n• Log out when finished\n• Report suspicious activity\n• Keep passwords strong and unique\n\nYour data and documents are protected by multiple layers of security!";
    }
    
    // Default response with contextual suggestions
    const responses = [
      "I'm here to help with the RMU Government System! 🚀\n\n**Popular questions I can answer:**\n• \"How do I upload a document?\"\n• \"How do I register a new user?\"\n• \"How do I set up routing rules?\"\n• \"Where do I find the dashboard?\"\n• \"What can different user roles do?\"\n\n💬 **Or try asking:**\n• \"Show me troubleshooting tips\"\n• \"Explain the security features\"\n• \"Help me navigate the system\"\n\nWhat would you like to accomplish today?",
      
      "Ready to help you master the RMU system! 🎯\n\n**I can guide you through:**\n• Document management workflows\n• User administration tasks\n• Automated routing setup\n• System navigation\n• Troubleshooting issues\n\n**Just ask me something like:**\n• \"Walk me through uploading a file\"\n• \"How do I organize my documents?\"\n• \"What's the difference between user roles?\"\n\nWhat specific task can I help you with?",
      
      "Your RMU Government System expert is ready! 🇰🇪\n\n**I specialize in helping with:**\n• Step-by-step procedures\n• Best practices and tips\n• Problem solving\n• Feature explanations\n• Workflow optimization\n\n**Popular topics:**\n• Document upload and management\n• User registration and roles\n• Automated routing rules\n• System security features\n\nWhat would you like to learn about or accomplish?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button - Enhanced Visibility */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999]" style={{ position: 'fixed', zIndex: 9999 }}>
          <Button
            onClick={() => setIsOpen(true)}
            className="h-20 w-20 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 pulse-animation border-4 border-white dark:border-gray-800 group"
            aria-label="Open RMU Assistant"
          >
            <div className="flex flex-col items-center">
              <Bot className="h-10 w-10 text-white mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-white font-semibold">Help</span>
            </div>
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed bottom-6 right-6 w-96 shadow-2xl z-50 flex flex-col border-2 border-blue-200 dark:border-blue-800 transition-all duration-300 ${
          isMinimized ? 'h-16' : 'h-[32rem]'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-t-lg border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  RMU Assistant
                </CardTitle>
                <p className="text-xs text-blue-700 dark:text-blue-300">Always ready to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <CardContent className="flex-1 flex flex-col p-0 bg-white dark:bg-gray-900">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-4 max-h-80">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm ${
                        message.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
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
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">
                      <div className="flex items-center space-x-1">
                        <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Assistant is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about the RMU system..."
                    onKeyPress={handleKeyPress}
                    className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-900"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 px-3"
                    disabled={!inputMessage.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  Press Enter to send • Shift+Enter for new line
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
      

    </>
  );
}