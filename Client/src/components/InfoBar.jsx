import { IoCloseCircleOutline } from "react-icons/io5";
import { useState,useEffect } from "react";
import { useRef } from "react";
const InfoBar = ({room  ,users,name}) => {
    const onlineRef=useRef();
    const [isOpen, setIsOpen] = useState(false);

    const toggleOnlineUsers = () => {
        setIsOpen(!isOpen);
    };
    useEffect(() => {
        function handleClickOutside(event) {
          if (onlineRef.current && !onlineRef.current.contains(event.target)) {
            setIsOpen(false);
          }
        }
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, []);
    return ( 
    <div className="">
    <div className=" flex justify-between h-12 bg-blue-600 items-center px-3 rounded-t-xl">
    <div className="flex">
        <div className="">

        
        <div className="cursor-pointer" onClick={toggleOnlineUsers} ><img src="/src/assets/Screenshot 2024-06-01 233050.png" alt="zerze" className="rounded-full w-3" /></div>
        {isOpen && (
            <div ref={onlineRef} className=" bg-blue-300 absolute z-10 rounded-lg px-3">
                <p className=" font-bold">Online users : </p>                
                {users && users.map(user => (
                    <span key={user.id} className="text-black flex p-1 items-center gap-2 font-semibold rounded text-sm">
                        <img src="/src/assets/Screenshot 2024-06-01 233050.png" alt="zerze" className="rounded-full w-2 h-2" />{user.username}
                    </span>
                ))}</div>

        )}
        </div>
       
        
    </div>
    <div>
        <h3 className="font-bold uppercase text-white" >{room}</h3>
        <p className="text-white">"{name}"</p>
    </div>
     
    <div>
        
        <a href="/">
            <IoCloseCircleOutline className="text-white text-2xl" />
        </a>

    </div>
    </div></div> );
}
 
export default InfoBar;