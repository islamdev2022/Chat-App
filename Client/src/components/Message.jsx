const Message = ({message:{user,text},name}) => {
    let isSentByCurrentUser = false;

    const trimmedName = name.trim().toLowerCase();

    if(user === trimmedName) {
        isSentByCurrentUser = true;
    }

    return ( 
        <div className="p-2">
    {isSentByCurrentUser ? ( 
        <div className="flex gap-4 justify-end">
            <p className=" bg-green-600">{text}</p>
            <div>
            <p>: {trimmedName}</p>
            </div>
        </div>
    ):(
        <div className="flex gap-4 ">
           
            <p>{user} : </p>
            <div>
                <p className=" bg-red-700">{text}</p>
            </div>
        </div>
    )}</div>
     );
}
 
export default Message;