<script>
    import { jData } from './store.js'

    let users = []
    let input = ''
    let results = []

    $: friends = $jData.friends

    // ############ CHAT RELATED ############

    const showChatWindow = (friend) => {
        if(!$jData.activeChats.includes(friend)) {           
            $jData.activeChats = [...$jData.activeChats, friend]
        }
    }

    // ############ ADD FRIEND RELATED ############

    async function getUsers(){
        try{
            let connection = await fetch("get-users", {
                method: 'GET'
            })
            let response = await(connection).json() 
            // removing this user from users array // alt: filter func
            let myPos = response.map(function(e) { return e._id }).indexOf($jData.userID)
            response.splice(myPos, 1)
            // removing friends from users array
            friends.forEach(friend => {
                let friendsPos = response.map(function(e) { return e._id }).indexOf(friend._id)
                // console.log(response)
                // console.log(friendsPos)
                response.splice(friendsPos, 1)
                //console.log(response)
            });
            users = response
            //console.log(users)
        }catch(err){
            console.log("error getting users"); return
        }
    }

    function checkInput(user){
        if(input == ''){return ''}
        return user.name.toLowerCase().includes(input.toLowerCase())
    }

    function searchUsers(){
        //console.log(users.filter(checkInput))
        results = users.filter(checkInput)
    }

    async function requestFriend(friend){
        let postData = [friend, 0, $jData.image]
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
            results = []
        }catch(err){
            console.log("error requesting friendship"); return
        }
    }

    //$: console.log($jData.onlineFriends)
</script>

<!-- ###################################### -->

<div id="a" class="main-right">
    <input id="add-friend" type="text" placeholder="Find friends" bind:value={input} on:click={getUsers} on:input={searchUsers} autocomplete="off">

    <div id="friend-search-results">
    {#each results as result}
        <div class="mini-profile" on:click={requestFriend(result)}>
            <img src="/media/{result.image}" alt="">
            <div>
                <div>{ result.name }</div>
                <div id="status-container">
                    {#if $jData.onlineFriends.includes(result._id)}
                        <div class="status-indicator" id="online"></div>
                        <p class="status-text">Online</p>
                    {:else}
                        <div class="status-indicator" id="offline"></div>
                        <p class="status-text" id="offline-text">Offline</p>
                    {/if}
                </div>
                <i class="fas fa-plus-circle"></i>
            </div>
        </div> 
    {/each}
    </div>

    {#each friends as friend}
        <div class="mini-profile" on:click={showChatWindow(friend)}>
            <img src="/media/{friend.image}" alt="">
            <div>
                <div>{ friend.name }</div>
                <div id="status-container">
                    {#if $jData.onlineFriends.includes(friend._id)}
                        <div class="status-indicator" id="online"></div>
                        <p class="status-text">Online</p>
                    {:else}
                        <div class="status-indicator" id="offline"></div>
                        <p class="status-text" id="offline-text">Offline</p>
                    {/if}
                </div>
            </div>
        </div> 
    {:else}
        <p>No friends added, search above to find friends</p>
    {/each}  

</div>

<!-- ###################################### -->

<style>

div.main-right{
    position: fixed;
    padding: 5rem 1rem;
    right: 0;
    display: grid;
    grid-auto-rows: min-content;
    width: 20vw;
    /* padding-right: 1rem; */
    height: 100vh;
    overflow-y: auto;
    /* z-index: 1; */
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.3);
}

div.mini-profile{
    cursor: pointer;
    padding: 0.5rem;
}

.status-indicator{
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 20px;
}

#offline {
    background: #f02849;
}

#online {
    background: rgb(80, 209, 80);
}

#offline-text {
    color: #b7b7b7;
}

#status-container{
    display: grid;
    grid-template-columns: min-content min-content;
    align-items: center;
    grid-column-gap: 0.3rem;
}

.status-text{
    font-weight: 500;
    font-size: 0.8rem;
    color: #3c3c3c;
}

#add-friend{
    margin-bottom: 1rem;
    width: 100%
}

#friend-search-results{
    position: absolute;
    background: #fff;
    z-index: 9999;
    border-radius: 0.3rem;
    top: 7.5rem;
    -webkit-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
    -moz-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
    margin: 0 1rem;
}

.fa-plus-circle {
color: rgb(111, 220, 111);
    position: absolute;
    top: 1.5rem;
    right: 2rem;
}

</style>