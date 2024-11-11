import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// Types
const initialProducts = [
  {
    id: 1,
    name: "Wireless Earbuds",
    price: 79.99,
    description: "High-quality sound with long battery life",
    image: "/images/earbuds.jpg",
    badge: "Best Seller",
    keywords: ["earbuds", "headphones", "audio", "wireless", "sound", "music", "earphones"]
  },
  // ... other products from your original data
];

const initialDeals = [
  {
    id: 1,
    name: "Summer Sale",
    discount: "20% off",
    description: "Get 20% off on all summer essentials",
    validUntil: "2024-08-31",
    keywords: ["summer", "sale", "discount", "seasonal", "hot", "deals"]
  },
  // ... other deals from your original data
];

const searchMappings = {
  watch: ["watch", "smartwatch", "wearable"],
  headphone: ["earbuds", "headphones", "earphones"],
  power: ["charger", "battery", "power bank"],
  deal: ["sale", "discount", "offer"],
  audio: ["earbuds", "headphones", "sound", "music"]
};

const Chatbox = () => {
  const [messages, setMessages] = useState([{
    text: "👋 Hi! I'm your AI shopping assistant. I can help you find products, compare prices, and discover great deals. What are you looking for today?",
    isUser: false,
    timestamp: new Date()
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: input
      });

      const aiMessage = {
        text: response.data.message,
        isUser: false,
        timestamp: new Date(),
        products: response.data.products,
        deals: response.data.deals
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, {
        text: "I'm sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderProductCard = (product) => (
    <div key={product.id} className="bg-white rounded-lg shadow-md p-4 mb-2 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{product.name}</h3>
            {product.badge && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {product.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
          <p className="text-sm font-bold mt-2">${product.price.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );

  const renderDealCard = (deal) => (
    <div key={deal.id} className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{deal.name}</h3>
      </div>
      <p className="text-sm font-bold text-blue-600 mt-1">{deal.discount}</p>
      <p className="text-sm text-gray-600">{deal.description}</p>
      {deal.validUntil && (
        <p className="text-xs text-gray-500 mt-2">
          Valid until {new Date(deal.validUntil).toLocaleDateString()}
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-[600px] bg-gray-50 rounded-lg shadow-lg border">
      <div className="p-4 border-b bg-white">
        <h2 className="text-lg font-semibold flex items-center">
          <span className="mr-2">🛍️</span>
          AI Shopping Assistant
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.isUser
                  ? "bg-blue-600 text-white"
                  : "bg-white border shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {msg.products && msg.products.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">
                    {msg.products.length === 1
                      ? "Recommended Product:"
                      : "Recommended Products:"}
                  </h3>
                  <div className="space-y-2">
                    {msg.products.map(product => renderProductCard(product))}
                  </div>
                </div>
              )}
              {msg.deals && msg.deals.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Available Deals:</h3>
                  <div className="space-y-2">
                    {msg.deals.map(deal => renderDealCard(deal))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-3 border shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about products or deals..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;