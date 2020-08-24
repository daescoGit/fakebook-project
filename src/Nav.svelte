<script>
  import { jData } from "./store.js"
  import { fly, fade } from 'svelte/transition'
  import Notice from './Notifications.svelte'

  $: unreadMessagesCount = $jData.unreadMessages.length
  $: unreadNotificationsCount = $jData.unreadPosts.length+$jData.friendRequests.length+$jData.unreadComments.length

  // let unreadPostsInfo = ''
  // let friendRequestsInfo = []
  let noticeOpen = false
  let menu = false
  export let getTime
  export let time

  // function checkNotice(){ 
  //   if(noticeOpen){
  //     unreadPostsInfo = ''
  //     friendRequestsInfo = []
  //     unreadNotificationsCount = unreadNotificationsCount
  //     noticeOpen = false
  //     return
  //   }
  //   unreadPostsInfo = $jData.unreadPosts.length+' Unread posts'
  //   friendRequestsInfo = $jData.friendRequests
  //   //console.log($jData.friendRequests)
  //   unreadNotificationsCount = 0
  //   noticeOpen = true
  // }

  async function checkMsg(){
    if($jData.unreadMessages.length > 0){
      try{
        let connection = await fetch("update-msg-notifications/"+localStorage.uid, {
          method: 'PATCH',       
          headers: {
            'X-Custom-Header': localStorage.jwt
          }
        })
        let response = await(connection)

        $jData.unreadMessages.forEach(unreadMessage => {    
          if($jData.activeChats.filter((i) => { return i._id != unreadMessage.senderId })) {
              $jData.activeChats = [...$jData.activeChats, ...$jData.friends.filter((i) => { return i._id == unreadMessage.senderId })]
          }
        })
        $jData.unreadMessages = []
      }catch(err){
        console.log("error updating"); return
      }
    }
  }

  async function uploadImage() {
    let form = new FormData(document.querySelector("#frmNewImage"))
    let connection = await fetch("profile-image", {
      method: "PATCH",
      headers: {
      'X-Custom-Header': localStorage.jwt
      },
      body: form
    })
    let response = await(connection)
    console.log(response)
    menu = !menu
  }

  const menuToggle = () => {
    menu = !menu
  }

</script>

<!-- ###################################### -->
<nav>
    <div class="left">
        <div class="logo">
          <i class="fas fa-crow"></i> fakebook
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

        <div class="mini-profile">
          <img src="/media/{$jData.image}" alt="">
        </div>

        <div class="notice" on:click={checkMsg}>
          <i class="far fa-comment-alt"></i>
          <div class="chat-counter">{unreadMessagesCount}</div>  
          {#if unreadMessagesCount > 0 }
            <div class="new-notifications" transition:fade={{ duration: 400 }}>New!</div>
          {/if}
        </div>

        <div class="notice" on:click={() => { noticeOpen = !noticeOpen }}>
          <!-- <label id="notice-label" class="nav-right-labels" for="notice"></label> -->
          <i class="far fa-bell"></i>
          <div class="notification-counter">{unreadNotificationsCount}</div>
          {#if unreadNotificationsCount > 0  && !noticeOpen}
            <div class="new-notifications" transition:fade={{ duration: 400 }}>New!</div>
          {/if}

          {#if noticeOpen}
            <Notice {getTime} {time}/>
          {/if}
        </div>

        <i class="fas fa-user-cog" on:click={menuToggle}></i>          
    
    </div>
      {#if menu}
        <div id="menu" transition:fly="{{ x: 200, duration: 300 }}">
          <button class="close" on:click={menuToggle}>X</button>
          <a href="logout">Logout</a>   
          <form on:submit|preventDefault id="frmNewImage">
            <label for="profile" id="profile-image-label"><i class="far fa-image photo"></i> Profile Picture</label>
            <input type="file" name="profile" id="profile" on:change={uploadImage}>
          </form>
        </div>
      {/if}
</nav>

<!-- ###################################### -->

<style>

a{
  text-decoration: none;
}

i {
  cursor: pointer;
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
  position: absolute;
  right: 0;
  top: 0;
  height: 100vh;
  /* height: 20rem; */
  width: 15rem;
  background: white;
  padding: 2rem;
  -webkit-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
  -moz-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
  box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.3);
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