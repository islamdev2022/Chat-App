const Input = ({message,sendMessage,setMessage}) => {
    return ( <form className="py-2">
     <input
                    className=" w-80 py-2 outline-slate-500 border rounded-xl text-center"
                    value={message}
                    placeholder="Type a message..."
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyPress={(event) => event.key === 'Enter' ? sendMessage(event) : null}
                />
                <button onClick={(event) => sendMessage(event)} className='p-2'>Send</button> 
    </form> );
}
 
export default Input;