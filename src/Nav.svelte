<script>
  import { jData } from "./store.js"
  $: unreadMessagesCount = $jData.unreadMessages.length
  $: unreadNotificationsCount = $jData.unreadPosts.length+$jData.friendRequests.length

  let unreadPostsInfo = ''
  let friendRequestsInfo = []
  let open = false

  function checkNotice(){ 
    if(open){
      unreadPostsInfo = ''
      friendRequestsInfo = []
      unreadNotificationsCount = unreadNotificationsCount
      open = false
      return
    }
    unreadPostsInfo = $jData.unreadPosts.length+' Unread posts'
    friendRequestsInfo = $jData.friendRequests
    //console.log($jData.friendRequests)
    unreadNotificationsCount = 0
    open = true
    //document.querySelector('#notice-label').setAttribute("style", "height: 100vh; width: 12rem; top: -1rem; right: -1rem;");
  }

  async function checkPosts(){
    $jData.posts = [...$jData.unreadPosts, ...$jData.posts]
    //$jData.friendPosts = [...$jData.unreadPosts, ...$jData.friendPosts]
    $jData.unreadPosts = []
    try{
      let connection = await fetch("update-notifications", {
        method: 'POST',       
        headers: {
        'X-Custom-Header': localStorage.jwt,
        'X-Custom-Header-Data': JSON.stringify($jData.posts)
        }
      })
      let response = await(connection)
      //console.log(response.status)
    }catch(err){
      console.log("error updating"); return
    }
  }

  async function frResponse(friend, frRes){
    let postData = [friend, frRes]
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
    }catch(err){
        console.log("error handling friend request"); return
    }
  }

</script>

<!-- ###################################### -->
<nav>
    <div class="left">
        <div class="logo">
        <i class="fas fa-crow"></i> fakebook
        </div>
        <div>
        <form>
            <div>
            <i class="fas fa-search"></i>
            <input type="text">
            </div>
        </form>
        </div>
    </div>

    <div class="middle">
        <div class="active">
        <i class="fas fa-home"></i>
        </div>
        <div>
        <i class="fas fa-video"></i>
        </div>
        <div>
        <i class="fas fa-shopping-basket"></i>
        </div>            
    </div>

    <div class="right">
        <div>
          { $jData.userName.charAt(0).toUpperCase() + $jData.userName.slice(1) }        
        </div>
        <div>
          <i class="far fa-comment-alt"></i>
          <div class="chat-counter">{unreadMessagesCount}</div>       
        </div>
        
        <div id="notice" on:click={checkNotice}>
          <!-- <label id="notice-label" class="nav-right-labels" for="notice"></label> -->
          <i class="far fa-bell"></i>
          <div class="notification-counter">{unreadNotificationsCount}</div>
          {#if unreadNotificationsCount > 0 }
            <div class="new-notifications">New!</div>
          {/if}
          <div id="notice-messages">
            <div class="notice-messages-element" on:click={checkPosts}>{unreadPostsInfo}</div>
            {#if $jData.friendRequests.length > 0 }
              {#each friendRequestsInfo as friendRequest}
                <div class="notice-messages-element">
                  Friend requests from: {friendRequest.name}
                  <div on:click={frResponse(friendRequest, 1)}>✔️</div>
                  <div on:click={frResponse(friendRequest, 2)}>❌</div>
                </div> 
              {/each}
            {/if}
          </div>
          <!-- <button id="notis" class="btn-hidden" on:click={checkPosts}></button>  -->
        </div>
        <div>
          <i class="fas fa-user"></i>      
        </div>                  
    </div>
</nav>

<!-- ###################################### -->

<style>

nav{
  display: grid;
  grid-template-columns: 25fr 40fr 10fr;
  grid-gap: 2rem;

  position: fixed;
  top: 0px;
  left: 0px;
  width: 100vw;
  height: 4rem;
  padding: 0px 2vw;
  font-size: 1.5rem;
  color: #555;
  background: white;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.3);
  z-index: 1;
}
nav div.active{
  border-bottom: 0.2rem solid #1da1f2;
}
nav div.left{
  display: grid;
  grid-template-columns: 5fr 10fr;
  grid-gap: 1rem;
  align-items: center;
}
nav div.left div.logo{
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  grid-gap: 0.5rem;
  font-weight: 400;
  color: #1da1f2;
}
nav div.left form > div{
  position: relative;
}
nav div.left form > div > i{
  position: absolute;
  right: 0.5rem;
  margin-top: 0.8rem;
  font-size: 1rem;
}
nav div.left form > div > input{
  padding-right: 1.8rem;
}
nav div.middle{
  display: grid;
  grid-template-columns: 10fr 10fr 10fr;
  justify-items: center;
  grid-gap: 1rem;
  align-items: center;
}
nav div.middle > div{
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  align-items: center;

  position: relative;
  width: 100%;
  height: 100%;
}
nav div.right{
  display: grid;
  grid-template-columns: 8fr 8fr 1fr 1fr 8fr;
  align-items: center;
  grid-gap: 2rem;
  align-items: center;
}
nav div.right > div{
  position: relative;
}
nav div.right > div:last-child{
  text-align: right;
}
nav div.chat-counter{
  display: grid;
  justify-content: center;
  align-content: center;

  position: absolute;
  top: -0.6rem;
  right: -1rem;

  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background: #f02849;
  border-radius: 50%;
}
nav div.notification-counter{
  display: grid;
  justify-content: center;
  align-content: center;

  position: absolute;
  top: -0.6rem;
  right: -1rem;

  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background: #f02849;
  border-radius: 50%;
}
.new-notifications {
    position: absolute;
    font-size: 1rem;
    width: max-content;
    left: -0.75rem;
    top: 2.2rem;
    font-weight: 400;
    background: #fdffd6;
    color: #868629;
    padding: 0.3rem;
    border-radius: 0.3em;
    -webkit-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
    -moz-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
    z-index: 9999;
}
#notice-messages{
    position: absolute;
    min-width: 10rem;
    text-align: center;
    right: 0;
    font-size: 1.0rem;
    background: white;
    border-radius: 0.3rem;
    font-weight: 400;
    -webkit-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
    -moz-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
}

.btn-hidden{
  display: none;
}

.nav-right-labels{
  width: 3.1rem;
  right: -0.9rem;
  top: -1rem;
  height: 5rem;
  position: absolute;
  z-index: 3;
}
.nav-right-labels:hover{
  cursor: pointer;
}

#notice:hover{
  cursor: pointer;
}

/* .notice-messages-element{
  padding: 0.5rem;
} */

</style>