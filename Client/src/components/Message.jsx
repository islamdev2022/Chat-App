const Message = ({ message: { user, text }, name }) => {
    const isSentByCurrentUser = user === name.trim().toLowerCase()
  
    if (isSentByCurrentUser) {
      return (
        <div className="flex justify-end mb-2 pr-4">
          <div className="max-w-[80%]">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm break-words">{text}</p>
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
              <p className="text-sm break-words text-slate-800">{text}</p>
            </div>
            <span className="text-xs text-slate-500 mt-1 block pl-1">{user}</span>
          </div>
        </div>
      )
    }
  }
  
  export default Message
  
  