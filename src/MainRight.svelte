<script>
    import { jData } from './store.js'
    //import { addChatWindow } from './ChatContainer.svelte'
    $: friends = $jData.friends

    let users = []
    let input = ''
    let results = []

    // ############ CHAT RELATED ############

    const showChatWindow = (friendID) => {
        document.getElementById(friendID).setAttribute("style", "display:block;")
    }

    // ############ ADD FRIEND RELATED ############

    async function getUsers(){
        try{
            let connection = await fetch("get-users", {
                method: 'POST'
            })
            let response = await(connection).json() 
            // removing this user from users array
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
        return user.name.includes(input)
    }

    function searchUsers(){
        //console.log(users.filter(checkInput))
        results = users.filter(checkInput)
    }

    async function requestFriend(friend){
        let postData = [friend, 0]
        try{
            let connection = await fetch("add-friend", {
                method: 'POST',
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

</script>

<!-- ###################################### -->

<div id="a" class="main-right">

    <input id="add-friend" type="text" placeholder="Add a friend" bind:value={input} on:click={getUsers} on:input={searchUsers} autocomplete="off">

    <div id="friend-search-results">
    {#each results as result}
        <div class="mini-profile" on:click={requestFriend(result)}>
            <img src="/media/{result.image}" alt="">
            <div>
                <div>{ result.name }</div>
                <div id="status-container">
                    <div id="status-indicator"></div>
                    <p id="status-text">Offline</p>
                </div>
                <i class="fas fa-plus-circle"></i>
            </div>
        </div> 
    {/each}
    </div>

    {#each friends as friend}
        <div class="mini-profile" on:click={showChatWindow(friend._id)}>
            <img src="/media/{friend.image}" alt="">
            <div>
                <div>{ friend.name }</div>
                <div id="status-container">
                    <div id="status-indicator"></div>
                    <p id="status-text">Offline</p>
                </div>
            </div>
        </div> 
    {/each}  

</div>

<!-- ###################################### -->

<style>

div.main-right{
    position: fixed;
    top: 5rem;
    left: 75vw;
    display: grid;
    grid-auto-rows: min-content;
    width: 25vw;
    padding-right: 1rem;
    height: calc(100vh - 5.5rem);
    overflow-y: auto;
    /* z-index: 1; */
}

div.mini-profile{
    cursor: pointer;
    padding: 0.5rem;
}

#status-indicator{
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 20px;
    background: #f02849;
}

#status-container{
    display: grid;
    grid-template-columns: min-content min-content;
    align-items: center;
    grid-column-gap: 0.3rem;
}

#status-text{
    font-size: 0.9rem;
}

#add-friend{
    margin-bottom: 1rem;
    width: 80%
}

#friend-search-results{
    position: absolute;
    /* width: 100%; */
    background: #fff;
    z-index: 9999;
    border-radius: 0.3rem;
    top: 2.5rem;
    -webkit-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
    -moz-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
    margin: 0.3rem;
}

.fa-plus-circle {
color: rgb(111, 220, 111);
    position: absolute;
    top: 1.5rem;
    right: 2rem;
}

</style>