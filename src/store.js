import { writable } from "svelte/store"
export let jData = writable(
    {
        "userID":"",
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
        "unreadPosts":[],
        "activeChats": [],
        "onlineFriends": [],
        "unreadComments":[],
        "highlightedPost": "",
        "highlightedID": ""
    }
)