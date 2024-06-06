import ScrollToBottom from 'react-scroll-to-bottom';
import Message from './Message';
const Messages = ({messages,name}) => {
    return ( 
    <div className='h-5/6'>
    <ScrollToBottom className="h-full py-2">
       
        {messages.map((message, i) => <div key={i} > <Message message={message} name={name}></Message> </div>)}
            
        </ScrollToBottom>

    </div> );
}
 
export default Messages;