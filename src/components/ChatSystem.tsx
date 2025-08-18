import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { User, Order, ChatMessage } from '../App';
import { Send, MessageCircle, User as UserIcon, Store } from 'lucide-react';

interface ChatSystemProps {
  currentUser: User;
  orders: Order[];
}

export function ChatSystem({ currentUser, orders }: ChatSystemProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get available chats based on user type
  const getAvailableChats = () => {
    if (currentUser.type === 'student') {
      // Students can chat with vendors they have orders with
      const vendorChats = orders.reduce((chats, order) => {
        const chatId = `${currentUser.id}_${order.vendorId}`;
        if (!chats.find(chat => chat.id === chatId)) {
          chats.push({
            id: chatId,
            name: order.vendorName,
            type: 'vendor' as const,
            lastMessage: '',
            unread: 0
          });
        }
        return chats;
      }, [] as Array<{ id: string; name: string; type: 'vendor' | 'student'; lastMessage: string; unread: number }>);
      
      return vendorChats;
    } else {
      // Vendors can chat with students who have orders with them
      const studentChats = orders.reduce((chats, order) => {
        const chatId = `${order.studentId}_${currentUser.id}`;
        if (!chats.find(chat => chat.id === chatId)) {
          chats.push({
            id: chatId,
            name: order.studentName,
            type: 'student' as const,
            lastMessage: '',
            unread: 0
          });
        }
        return chats;
      }, [] as Array<{ id: string; name: string; type: 'vendor' | 'student'; lastMessage: string; unread: number }>);
      
      return studentChats;
    }
  };

  const availableChats = getAvailableChats();

  // Mock messages data
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        senderId: '12345',
        senderName: 'Student 12345',
        receiverId: 'V001',
        message: 'Hi, is the Pad Thai still available?',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        orderId: '1'
      },
      {
        id: '2',
        senderId: 'V001',
        senderName: 'Thai Kitchen',
        receiverId: '12345',
        message: 'Yes, it\'s available! Your order is being prepared.',
        timestamp: new Date(Date.now() - 1620000), // 27 minutes ago
        orderId: '1'
      },
      {
        id: '3',
        senderId: '12345',
        senderName: 'Student 12345',
        receiverId: 'V001',
        message: 'Great! How long until it\'s ready?',
        timestamp: new Date(Date.now() - 1500000), // 25 minutes ago
        orderId: '1'
      },
      {
        id: '4',
        senderId: 'V001',
        senderName: 'Thai Kitchen',
        receiverId: '12345',
        message: 'About 10 more minutes. We\'ll call queue #15 soon.',
        timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
        orderId: '1'
      }
    ];
    setMessages(mockMessages);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages for selected chat
  const chatMessages = selectedChat 
    ? messages.filter(msg => {
        const chatId = selectedChat;
        return (msg.senderId === currentUser.id && chatId.includes(msg.receiverId)) ||
               (msg.receiverId === currentUser.id && chatId.includes(msg.senderId));
      })
    : [];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const receiverId = currentUser.type === 'student' 
      ? selectedChat.split('_')[1] 
      : selectedChat.split('_')[0];

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId: receiverId,
      message: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {availableChats.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 mb-2">No conversations</h3>
              <p className="text-gray-600 text-sm">
                {currentUser.type === 'student' 
                  ? 'Place an order to start chatting with vendors'
                  : 'Conversations with students will appear here'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-1">
                {availableChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`p-4 cursor-pointer transition-colors border-b ${
                      selectedChat === chat.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {chat.type === 'vendor' ? (
                            <Store className="h-8 w-8 p-1.5 bg-blue-100 text-blue-600 rounded-full" />
                          ) : (
                            <UserIcon className="h-8 w-8 p-1.5 bg-green-100 text-green-600 rounded-full" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{chat.name}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage || 'Start a conversation'}
                          </p>
                        </div>
                      </div>
                      {chat.unread > 0 && (
                        <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                          {chat.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="lg:col-span-2">
        {selectedChat ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                {currentUser.type === 'student' ? (
                  <Store className="h-8 w-8 p-1.5 bg-blue-100 text-blue-600 rounded-full" />
                ) : (
                  <UserIcon className="h-8 w-8 p-1.5 bg-green-100 text-green-600 rounded-full" />
                )}
                <div>
                  <CardTitle className="text-lg">
                    {availableChats.find(chat => chat.id === selectedChat)?.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {currentUser.type === 'student' ? 'Vendor' : 'Student'}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col h-[500px]">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => {
                      const isCurrentUser = message.senderId === currentUser.id;
                      const showDate = index === 0 || 
                        formatDate(message.timestamp) !== formatDate(chatMessages[index - 1].timestamp);
                      
                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="text-center text-xs text-gray-500 mb-4">
                              {formatDate(message.timestamp)}
                            </div>
                          )}
                          
                          <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${
                              isCurrentUser 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            } rounded-lg px-4 py-2`}>
                              <p className="text-sm">{message.message}</p>
                              <p className={`text-xs mt-1 ${
                                isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a chat from the list to start messaging</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}