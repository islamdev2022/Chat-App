import { useState, useEffect, useRef } from "react"
import { X, Users, ChevronDown } from "lucide-react"

const InfoBar = ({ room, users, name }) => {
  const onlineRef = useRef()
  const [isOpen, setIsOpen] = useState(false)
  const [isOnlineUsersOpen, setIsOnlineUsersOpen] = useState(false)
  const toggleOnlineUsers = () => {
    setIsOnlineUsersOpen(!isOnlineUsersOpen);
  };


  useEffect(() => {
    function handleClickOutside(event) {
      if (onlineRef.current && !onlineRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="border-b border-slate-200 mb-4">
        <div className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="relative">
            <button
              onClick={toggleOnlineUsers}
              className="flex items-center gap-1 text-white/90 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/10"
            >
              <Users size={16} />
              <span className="text-sm font-medium hidden sm:inline">Online</span>
              <ChevronDown 
                size={14} 
                className={`transition-transform ${isOnlineUsersOpen ? "rotate-180" : ""}`} 
              />
            </button>
            {isOnlineUsersOpen && (
              <div
                ref={onlineRef}
                className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 w-48 z-10 overflow-hidden"
              >
                <div className="p-2 bg-slate-50 border-b border-slate-200">
                  <p className="font-semibold text-sm text-slate-700">
                    Online Users ({users?.length || 0})
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {users && users.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-md"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-slate-700">
                        {user.username}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="font-bold uppercase text-white text-sm tracking-wide">{room}</h3>
            <p className="text-white/80 text-xs hidden sm:block">{name}</p>
          </div>
          <a 
            href="/chat" 
            className="text-white/80 hover:text-white hover:bg-red-600 transition-colors p-1 rounded-full "
          >
            <X size={20} />
          </a>
        </div>
</div>
  )
}

export default InfoBar

