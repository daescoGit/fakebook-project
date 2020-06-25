<script>
  import { jData } from "./store.js"
  $: unreadMessagesCount = $jData.unreadMessages.length
  $: unreadNotificationsCount = $jData.unreadPosts.length+$jData.friendRequests.length

  let unreadPostsInfo = ''
  let friendRequestsInfo = []
  let noticeOpen = false

  function checkNotice(){ 
    if(noticeOpen){
      unreadPostsInfo = ''
      friendRequestsInfo = []
      unreadNotificationsCount = unreadNotificationsCount
      noticeOpen = false
      return
    }
    unreadPostsInfo = $jData.unreadPosts.length+' Unread posts'
    friendRequestsInfo = $jData.friendRequests
    //console.log($jData.friendRequests)
    unreadNotificationsCount = 0
    noticeOpen = true
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

  async function checkMsg(){
    if($jData.unreadMessages.length > 0){
      try{
        let connection = await fetch("update-msg-notifications", {
          method: 'POST',       
          headers: {
            'X-Custom-Header': localStorage.jwt
          }
        })
        let response = await(connection)
        // open chat(s)
        $jData.unreadMessages.forEach(unreadMessage => {
          document.getElementById(unreadMessage.senderId).setAttribute("style", "display:block;")
        });     
        $jData.unreadMessages = []
      }catch(err){
        console.log("error updating"); return
      }
    }
  }

  async function uploadImage() {
    let form = new FormData(document.querySelector("#frmNewImage"))
    let connection = await fetch("profile-image", {
      method: "POST",
      headers: {
      'X-Custom-Header': localStorage.jwt
      },
      body: form
    })
    let response = await(connection)
  }

  function menu(){ document.getElementById("menu").setAttribute("style", "display:block;") }
  function menuClose(){ document.getElementById("menu").setAttribute("style", "display:none;") }
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

        <div class="notice" on:click={checkMsg}>
          <i class="far fa-comment-alt"></i>
          <div class="chat-counter">{unreadMessagesCount}</div>  
          {#if unreadMessagesCount > 0 }
            <div class="new-notifications">New!</div>
          {/if}
        </div>
        
        <div class="notice" on:click={checkNotice}>
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
        </div>
        <div>
          <i class="fas fa-user" on:click={menu}></i>      
        </div>                  
    </div>

    <div id="menu">
      <button class="close" on:click={menuClose}>X</button>
      <a href="logout">Logout</a>   
      <form on:submit|preventDefault id="frmNewImage">
        <label for="profile" id="profile-image-label"><i class="far fa-image photo"></i> Profile Picture</label>
        <input type="file" name="profile" id="profile" on:change={uploadImage}>
      </form>
    </div>
</nav>

<!-- ###################################### -->

<style>

a{
  text-decoration: none;
}

nav{
  display: grid;
  grid-template-columns: 33fr 33fr 33fr;
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
  box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.3);
  z-index: 1;
}
nav div.active{
  border-bottom: 0.2rem solid #575ed8;
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
  color: #575ed8;
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
  grid-template-columns: 8fr 1fr 1fr 1fr 1fr;
  align-items: center;
  grid-gap: 2rem;
  align-items: center;
}
nav div.right > div:first-child{
  text-align: end;
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
    z-index: 0;
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

.notice{
  cursor: pointer;
  max-width: fit-content;
}

/* .notice-messages-element{
  padding: 0.5rem;
} */

#menu{
  display: none;
  position: absolute;
  right: 0;
  top: 0;
  height: 100vh;
  width: 15rem;
  background: white;
  padding: 2rem;
  -webkit-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
  -moz-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
  box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
}

.fa-user{
  cursor: pointer;
}

.close{
  cursor: pointer;
  background: #989898;
  padding: 0.5rem 0.6rem 0.4rem;
  font-size: 0.8rem;
  text-align: center;
  color: white;
  border: none;
  position: absolute;
  top: 0.7rem;
  right: 1rem;
}

#profile{
  display: none;
}

#profile-image-label{
  font-size: 1.2rem;
  cursor: pointer;
}

</style>