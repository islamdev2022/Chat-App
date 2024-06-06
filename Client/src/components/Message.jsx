const Message = ({message:{user,text},name}) => {
    let isSentByCurrentUser = false;

    const trimmedName = name.trim().toLowerCase();

    if(user === trimmedName) {
        isSentByCurrentUser = true;
    }

    return ( 
        <div className="p-2">
    {isSentByCurrentUser ? ( 
        <div className="flex justify-end">
        <div className="flex gap-2 justify-end w-2/3 ">
            <p className=" bg-green-600 p-2 rounded-lg w-5/6 text-white break-words">{text}</p>
            
        </div>
        </div>
    ):(
        <div className="flex gap-3  ">
            <p className=" font-bold items-center flex">{user} : </p>
            <div className="w-3/5">
                <p className=" bg-red-700 p-2 rounded-lg text-left w-5/6 text-white break-words">{text}</p>
            </div>
        </div>
    )}</div>
     );
}
 
export default Message;