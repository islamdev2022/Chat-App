const Message = ({ message: { user, text }, name }) => {
    const normalizedCurrentUser = name.trim().toLowerCase();
  const isSentByCurrentUser = user.toLowerCase() === normalizedCurrentUser;
  
  // Safely display text content regardless of whether it's a string or object
  const displayText = () => {
    if (text === null || text === undefined) {
      return "Empty message";
    }
    
    if (typeof text === 'object') {
      // If text is an object with a text property, use that
      if (text.text) {
        return text.text;
      }
      // If it's an encrypted message or has other structure, handle appropriately
      if (text.encrypted || text.recipients) {
        return "Encrypted message";
      }
      // Fallback: stringify the object
      return JSON.stringify(text);
    }
    
    // If text is a string, use it directly
    return text;
  };

  console.log(displayText());
  
    console.log('user:', user)
  console.log('name:', name)
  console.log('isSentByCurrentUser:', isSentByCurrentUser)
  console.log(text.text)
    if (isSentByCurrentUser) {
      return (
        <div className="flex justify-end mb-2 pr-4">
          <div className="max-w-[80%]">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm break-words">{text.text ? text.text : text}</p>
            </div>
            <span className="text-xs text-slate-500 mt-1 block text-right pr-1">You</span>
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex mb-2">
          <div className="max-w-[80%]">
            <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-sm shadow-sm">
              <p className="text-sm break-words text-slate-800">{text.text ? text.text : text}</p>
            </div>
            <span className="text-xs text-slate-500 mt-1 block pl-1">{user}</span>
          </div>
        </div>
      )
    }
  }
  
  export default Message
  
  