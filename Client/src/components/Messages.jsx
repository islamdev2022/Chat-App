import ScrollToBottom from 'react-scroll-to-bottom';
import Message from './Message';
const Messages = ({messages,name}) => {
    return ( 
    <>
    <ScrollToBottom className="h-72 overflow-auto py-2">
       
        {messages.map((message, i) => <div key={i} > <Message message={message} name={name}></Message> </div>)}
            
        </ScrollToBottom>

    </> );
}
 
export default Messages;