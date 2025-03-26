import { useState } from "react";
import { Send } from "lucide-react";

const Input = ({ message, setMessage, sendMessage ,type }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    
    <div className="p-2 sm:p-3 border-t border-slate-200 bg-white">
      {
      type === "end2end" ? 
      <form onSubmit={sendMessage} className="flex items-center gap-2">
        <div
          className={`flex-1 rounded-full border ${
            isFocused
              ? "border-indigo-500 ring-2 ring-indigo-100"
              : "border-slate-300"
          } transition-all overflow-hidden bg-slate-50`}
        >
          <input
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-transparent outline-none text-sm"
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        <button
          type="submit"
          className="from-indigo-500 to-purple-500 bg-gradient-to-r hover:bg-indigo-700 text-white p-2 sm:p-2.5 rounded-full transition-colors flex items-center justify-center"
          disabled={!message.trim()}
        >
          <Send size={18} />
        </button>
      </form> :  
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 rounded-full border ${
            isFocused
              ? "border-indigo-500 ring-2 ring-indigo-100"
              : "border-slate-300"
          } transition-all overflow-hidden bg-slate-50`}
        >
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type your message..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-transparent outline-none text-sm"
                  />
                </div>
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className={`from-indigo-500 to-purple-500 bg-gradient-to-r hover:bg-indigo-700 text-white p-2 sm:p-2.5 rounded-full transition-colors flex items-center justify-center ${
                      !message.trim() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
    }
    
    </div>
  );
};

export default Input;
