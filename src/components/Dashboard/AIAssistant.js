import React, { useState } from 'react';
import { Bot, Send } from 'lucide-react';

const AIAssistant = ({ onCommand }) => {
  const [input, setInput] = useState('');

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="text-purple-600" size={20} />
        <span className="font-medium">AI Assistant</span>
      </div>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (input.trim()) {
          onCommand(input);
          setInput('');
        }
      }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything..."
            className="flex-1 p-2 border rounded"
          />
          <button type="submit" className="p-2 bg-purple-600 text-white rounded">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;