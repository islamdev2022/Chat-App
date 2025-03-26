import ScrollToBottom from "react-scroll-to-bottom"
import Message from "./Message"
import React from 'react';
const Messages = ({ messages, name }) => {
  console.log("messagesdsfsfsdf", messages)
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollToBottom className="h-full py-1 pl-4 custom-scrollbar shadow-xl">
        <div className="space-y-2">
          {messages.map((message, i) => (
            <Message key={i} message={message} name={name} />
          ))}
        </div>
      </ScrollToBottom>
    </div>
  )
}

export default Messages