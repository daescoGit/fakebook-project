import {writable} from "svelte/store"
export let jData = writable(
    {
        "unreadMessages":[
            {"id":1, "message":"a"},
            {"id":2, "message":"b"},
            {"id":3, "message":"c"},
            {"id":4, "message":"d"},
        ],
        "posts":[
            {"id":1, "title":"a"}
        ],
        "unreadPosts":[] // move to posts when clicked
    }
)
