import { IoMdSend } from "react-icons/io";
const Input = ({message,sendMessage,setMessage}) => {
    return ( <form className="p-2 gap-1 flex justify-between border-t rounded-2xl bg-white">
     <input
                    className=" w-full py-2 outline-slate-300 border rounded-xl text-center"
                    value={message}
                    placeholder="Type a message..."
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyPress={(event) => event.key === 'Enter' ? sendMessage(event) : null}
                />
                <button onClick={(event) => sendMessage(event)} className={`px-3 bg-blue-600 hover:bg-blue-500 ${!message ? " cursor-not-allowed" :"" } rounded-2xl text-white font-semibold`}><IoMdSend className=" size-4" /></button> 
    </form> );
}
 
export default Input;