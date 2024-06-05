// import { IoCloseCircleOutline } from "react-icons/io5";
const InfoBar = ({room}) => {
    return ( <div className="flex justify-between h-10 bg-blue-600 items-center px-3">
    <div className="flex  gap-3 ">
        <div className="w-1 h-fit rounded-full bg-green-500">.</div>
        <h3 className="font-bold uppercase text-white">{room}</h3>
        
    </div>
    <div>
        
        <a href="/">close</a>

    </div>
    </div> );
}
 
export default InfoBar;