<script>
    import { jData } from './store.js'
    import { fade, fly } from 'svelte/transition';
    $: unreadNotificationsCount = $jData.unreadPosts.length+$jData.friendRequests.length+$jData.unreadComments.length
    $: postNotices = [...$jData.unreadComments, ...$jData.unreadPosts]
    let scrollPos = 0
    export let getTime
    export let time
    $: combined = [...$jData.unreadPosts, ...$jData.unreadComments]
    $: sorted = combined.sort(function (a, b){
        // timestamp is contained in the first 4 bytes of mongo id
        let p1 = new Date(parseInt( a._id.toString().substring(0,8), 16 ) * 1000)
        let p2 = new Date(parseInt( b._id.toString().substring(0,8), 16 ) * 1000)
        return p2 - p1
    })

    async function checkPost(postType, id){  
        if(postType == 1){
             $jData.highlightedPost = $jData.posts.find((i) => { return i._id == id })
        }else if(postType == 2){
            $jData.highlightedPost = $jData.posts.find((i) => { return i.comments.find((i) => { return i._id == id })})
            $jData.highlightedID = id
        }
        // else{
        //     $jData.unreadPosts = []
        //     $jData.unreadComments = []
        // }

        try{
            let connection = await fetch("update-notifications/"+localStorage.uid, {
                method: 'PATCH',       
                headers: {
                    'X-Custom-Header': localStorage.jwt,
                    'X-Custom-Header-Data': JSON.stringify([postType, id]) // can get too large!
                }
            })
            let response = await(connection)
            //console.log(response.status)
        }catch(err){
            console.log("error updating"); return
        }
    }

    async function frResponse(friend, frRes){
        let postData = [friend, frRes, $jData.image]
        try{
            let connection = await fetch("add-friend", {
                method: 'PATCH',
                headers: {
                    'X-Custom-Header': localStorage.jwt,
                    'X-Custom-Header-Data': JSON.stringify(postData)
                }
            })
            let response = await(connection)
            console.log(response) 
        }catch(err){
            console.log("error handling friend request"); return
        }
    }
</script>

<div id="container" on:scroll="{() => { scrollPos = document.querySelector('#container').scrollTop }}" transition:fly="{{ y: -10, duration: 200 }}">
    {#if unreadNotificationsCount == 0}
        No new notifications
    {:else}
        {#if $jData.friendRequests.length > 0}
            {#each $jData.friendRequests as friendReq }
                <div class="friend-req">
                    <img src="/media/{friendReq.image}" alt="">
                    <div on:click={frResponse(friendReq, 1)}>✔️</div>
                    <div on:click={frResponse(friendReq, 2)}>❌</div>
                    <p>Friend request from <span>{friendReq.name}</span></p>
                </div>
            {/each}
        {/if}

        {#if sorted.length > 0}
            {#each sorted as postNotice }
                {#if postNotice.comments}
                    <div class="notices" on:click={() => checkPost(1, postNotice._id)}>
                        <p>
                            <span class="time">({getTime(postNotice._id, time, 1)})</span><span class="name">{postNotice.name}</span>
                            <span class="msg">Posted: "{postNotice.message.substr(0, 15)}{#if postNotice.message.length > 20}...{/if}"</span>
                        </p>
                    </div>
                {:else}
                    <div class="notices" on:click={() => checkPost(2, postNotice._id)}>
                        <p>
                            <span class="time">({getTime(postNotice._id, time, 1)})</span><span class="name">{postNotice.name}</span>
                            <span class="msg">Commented on your post</span>
                        </p>
                    </div>
                {/if}
            {/each}
        {/if}
        {#if  scrollPos == 0 && ($jData.unreadPosts.length > 0 || $jData.unreadComments > 0)} 
            <div id="clear" transition:fade="{{ duration:150 }}" on:click={() => checkPost(3, 0)}> Clear all </div>
        {/if}
    {/if}
</div>



<style>

#container {
    position: absolute;
    width: 300px;
    min-width: max-content;
    right: -1rem;
    background: white;
    padding: 1rem;
    font-size: 1rem;
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.3);
    max-height: 15rem;
    overflow-y: auto;
}

#clear {
    position: absolute;
    bottom: 0;
    right: 0;
    background: #f8f8f8;
    padding: 0.1rem 0.8rem;
    font-weight: 400;
    font-size: 0.8rem;
    margin: 0.7rem;
    border-radius: 0.3rem;
    border: 1px solid #e6e6e6;
}

.notices {
    margin-bottom: 0.6rem;
    border: 1px solid #f0f0f0;
    padding: 0.2rem;
    background: #fcfcfc;
}

.name {
    font-weight: 400;
    color: #575ed8;
}

.time {
    display: inline-block;
    color: rgb(157, 157, 157);
    min-width: 40px;
    font-size: 0.9rem;
}

.msg {
    font-size: 0.9rem;
    font-style: italic;
}

.friend-req {
    display: flex;
    grid-template-columns: auto auto auto auto;
    border-bottom: 1px solid rgb(222 222 222);
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 400;
    gap: 5px;
}

.friend-req > p {
    font-style: italic;
}

.friend-req > p > span{
    color: #575ed8;
}

img {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    object-fit: cover;
}
</style>
