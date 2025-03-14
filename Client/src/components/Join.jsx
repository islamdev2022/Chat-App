import { useState, useEffect } from "react"
import axios from "axios"
import { Users, Plus, LogIn, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
const Join = () => {
  const [name, setName] = useState("")
  const [room, setRoom] = useState("")
  const [rooms, setRooms] = useState([])
  const [newRoom, setNewRoom] = useState("")
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
let MainUrl = import.meta.env.VITE_SERVER_URL
  useEffect(() => {
    axios
      .get(`${MainUrl}/rooms`)
      .then((response) => {
        setRooms(response.data)
      })
      .catch((error) => {
        console.error("There was an error fetching the rooms!", error)
      })
  }, [])

  const handleRoomChange = (event) => {
    const selectedRoom = event.target.value
    if (selectedRoom === "newRoom") {
      setIsCreatingRoom(true)
      setRoom("")
    } else {
      setIsCreatingRoom(false)
      setRoom(selectedRoom)
    }
    validateField("room", selectedRoom)
  }

  const validateField = (fieldName, value) => {
    const newErrors = { ...errors }

    switch (fieldName) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Username is required"
        } else if (value.trim().length < 3) {
          newErrors.name = "Username must be at least 3 characters"
        } else {
          delete newErrors.name
        }
        break
      case "room":
        if (!value && !isCreatingRoom) {
          newErrors.room = "Please select a room"
        } else {
          delete newErrors.room
        }
        break
      case "newRoom":
        if (isCreatingRoom && !value.trim()) {
          newErrors.newRoom = "New room name is required"
        } else if (isCreatingRoom && value.trim().length < 3) {
          newErrors.newRoom = "Room name must be at least 3 characters"
        } else {
          delete newErrors.newRoom
        }
        break
      default:
        break
    }

    setErrors(newErrors)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate all fields
    validateField("name", name)
    validateField("room", room)
    if (isCreatingRoom) {
      validateField("newRoom", newRoom)
    }

    // Check if there are any errors
    if (Object.keys(errors).length === 0) {
      // Form is valid, proceed with submission
      console.log("Form is valid, submitting...")
      // Here you would typically handle the form submission
      // For now, we'll just log the data
      console.log({
        name,
        room: isCreatingRoom ? newRoom : room,
      })
    } else {
      console.log("Form has errors, please correct them.")
    }

    setIsSubmitting(false)
  }

  const ErrorMessage = ({ message }) => (
    <p className="text-red-500 text-xs italic mt-1 flex items-center">
      <AlertCircle size={14} className="mr-1" />
      {message}
    </p>
  )

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl px-8 pt-6 pb-8 mb-4">
          <h2 className="text-3xl font-bold text-center mb-6 text-indigo-800">Join a Chat</h2>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Users size={18} />
              </span>
              <input
                className={`appearance-none border rounded-lg w-full py-3 px-4 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 transition-all duration-200 ${errors.name ? "border-red-500" : ""}`}
                id="username"
                type="text"
                placeholder="Enter your username"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  validateField("name", e.target.value)
                }}
              />
            </div>
            {errors.name && <ErrorMessage message={errors.name} />}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="room">
              Select Room
            </label>
            <div className="relative">
              <select
                className={`block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 transition-all duration-200 ${errors.room ? "border-red-500" : ""}`}
                id="room"
                value={room}
                onChange={handleRoomChange}
              >
                <option value="" disabled>
                  Select a room
                </option>
                {rooms.map((room, index) => (
                  <option key={index} value={room[1]?.name}>
                    {room[1]?.name}
                  </option>
                 ))}
                <option value="newRoom">Create a new room</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {errors.room && <ErrorMessage message={errors.room} />}
          </div>

          {isCreatingRoom && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newRoom">
                New Room Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Plus size={18} />
                </span>
                <input
                  className={`appearance-none border rounded-lg w-full py-3 px-4 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 transition-all duration-200 ${errors.newRoom ? "border-red-500" : ""}`}
                  id="newRoom"
                  type="text"
                  placeholder="Enter new room name"
                  value={newRoom}
                  onChange={(e) => {
                    setNewRoom(e.target.value)
                    validateField("newRoom", e.target.value)
                  }}
                />
              </div>
              {errors.newRoom && <ErrorMessage message={errors.newRoom} />}
            </div>
          )}

          <div className="flex items-center justify-center">
          <Link
      onClick={e => (!name || (!room && !newRoom)) ? e.preventDefault() : null}
      to={`/chat?name=${name}&room=${isCreatingRoom ? newRoom : room}`}
              className="w-full">
            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
            >
              <LogIn size={18} className="mr-2" />
              Join Chat
            </button>
            </Link>
          </div>
        </form>
        <p className="text-center text-gray-600 text-xs">&copy;2025. All rights reserved.</p>
      </div>
    </div>
  )
}

export default Join

