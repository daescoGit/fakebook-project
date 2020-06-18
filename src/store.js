import { writable } from "svelte/store"
export let jData = writable(
    {
        "userName":"",
        "password":"",
        "email":"",
        "image": "",
        "friends":[],
        "friendRequests":[], 
        "groups":[], 
        "messages":[],
        "unreadMessages":[],
        "posts":[],
        "friendPosts":[],
        "unreadPosts":[]
    }
)