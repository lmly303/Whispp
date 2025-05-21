import {create} from 'zustand'
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios.js';
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/" ;

export const useAuthStore = create((set,get)=>(
    {
        authUser:null,
        isSigningUp: false,
        isLoggingIn: false,
        isUpdatingProfile: false,
        isCheckingAuth: true,
        onlineUsers: [],
        socket: null,

        checkAuth: async() => {
            try {
                const res = await axiosInstance.get("/auth/check");
                set({authUser: res.data})

                get().connectSocket()

            } catch (error) {
                console.log("error in useAuthStore", error)
                set({authUser: null})
            } finally {
                set({isCheckingAuth:false})
            }
        },

        signup: async(data)=>{
            set({ isSigningUp: true });
            try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data });

            get().connectSocket() // as soon as we signup connect us to socket server

            toast.success("Account Created Successfully");
            } catch (error) {
            toast.error(error.response.data.message);
            } finally {
            set({ isSigningUp: false });
            }
        },

        logout: async()=>{
            try {
                const res = await axiosInstance.post("/auth/logout")
                set({ authUser: null });
                toast.success("Logged Out Successfully")

                get().disconnectSocket()
            } catch (error) {
                toast.error(error.response.data.message);
            }
        },

        login: async(data)=>{
            try {
                set({isLoggingIn: true})
                const res = await axiosInstance.post("/auth/login", data)
                set({authUser: res.data})
                toast.success("Logged In Successfully")

                get().connectSocket() // as soon as we login connect us to socket server

            } catch (error) {
                console.error("Login error:", error)
                const message = error?.response?.data?.message || "Something went wrong during login.";
                toast.error(message);
            } finally {
                set({ isLoggingIn: false });
            }
        },

        updateProfile: async(data)=>{
            set({isUpdatingProfile: true})

            try {
                const res = await axiosInstance.put("/auth/update-profile", data)
                set({authUser: res.data})
                toast.success("Profile Updated Successfully")
            } catch (error) {
                console.log("Error in update Profile", error)
                toast.error(error.response.data.message)
            } finally{
                set({isUpdatingProfile: false})
            }
        },

        connectSocket: async ()=>{
            const {authUser} = get();
            if(!authUser || get().socket?.connected ) return;

            const socket = io(BASE_URL, {
                query: {
                    userId:authUser._id
                }
            })
            socket.connect()

            set({socket: socket})

            socket.on("getOnlineUsers", (userIds)=>{
                set({onlineUsers: userIds})
            })
        },

        disconnectSocket: async ()=>{
            if(get().socket?.connected) get().socket?.disconnect();
        },
    }
))