<script>
  import { jData } from './store.js'
  import { fade, fly, scale, blur } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  export let getTime
  export let time

  let count = 3
  let count2 = 3
  let highlighted

  $: if ($jData.highlightedPost){
    highlighted = $jData.posts.find((i) => { return i._id == $jData.highlightedPost._id })
  }

  function loadMore(){
    count += 3
  }

  async function like() {
    let status = this.checked
    let pid = this.getAttribute("id")
    //let postData = [{status}, {postID}]
    //console.log(postData)
    try{
      let connection = await fetch("like-post/"+pid, {
        method: 'PATCH',       
        headers: {
        'X-Custom-Header': localStorage.jwt,
        'X-Custom-Header-Data': JSON.stringify(status)
        },
      })
      let response = await(connection)
    }catch(err){
      console.log("error updating"); return
    }
  }

  async function deletePost(pid) {
    try{
      let connection = await fetch("delete-post/"+pid, {
        method: 'DELETE',       
        headers: {
          'X-Custom-Header': localStorage.jwt
          //'X-Custom-Header-Data': JSON.stringify(id)
        },
      })
      let response = await(connection)
    }catch(err){
      console.log("error updating"); return
    }
  }

  async function comment(pid, puid) {
    try{
      let form = new FormData(document.querySelector("#frmNewComment-"+pid))
      let connection = await fetch("posts/"+pid, {
        method: "PATCH",
        headers: {
          'X-Custom-Header': localStorage.jwt,
          'X-Custom-Header-Data': puid
        },
        body: form
      })
      let response = await(connection).text()
      document.querySelector("#frmNewComment-"+pid).reset()
    }catch(err){
      console.log("error updating"); return
    }
  }

  async function deleteComment(pid, cid, cuid) {
    try{
      let connection = await fetch("posts/"+pid+"/"+cid, {
        method: "PATCH",
        headers: {
          'X-Custom-Header': localStorage.jwt,
          'X-Custom-Header-Data': cuid
        }
      })
      let response = await(connection).text()
    }catch(err){
      console.log("error updating"); return
    }
  }

  async function likeComment(pid, cid) {
    let status = document.getElementById(cid).checked
    try{
      let connection = await fetch("like-comment/"+pid+"/"+cid, {
        method: 'PATCH',       
        headers: {
        'X-Custom-Header': localStorage.jwt,
        'X-Custom-Header-Data': JSON.stringify(status)
        },
      })
      let response = await(connection)
    }catch(err){
      console.log("error updating"); return
    }
  }

  function fadeInput(pid, faded) {
    if(faded){
      document.querySelector('#frmNewComment-'+pid).setAttribute("style", "opacity:100%;")
    }else{
      document.querySelector('#frmNewComment-'+pid).setAttribute("style", "opacity:40%;")
    }
  }

</script>

<!-- ###################################### -->

  {#if $jData.highlightedPost == undefined}
    <p id="close-highlight" on:click={() => { $jData.highlightedPost = "" }}>Close highlight</p>
    <div class="fancy-spacer"></div>
      <div style="text-align: center; font-size: 1rem;" in:scale="{{ duration: 300 }}" out:fly="{{ x: -50, duration: 200}}" >Selected post or comment has been deleted.</div>
    <div class="fancy-spacer"></div>
  {:else if $jData.highlightedPost}
    <p id="close-highlight" on:click={() => { $jData.highlightedPost = "" }}>Close highlight panel</p>
    <div class="fancy-spacer"></div>
    <div id="highlighted" in:scale="{{ duration: 300 }}" out:fly="{{ x: -50, duration: 200}}" class="post">
      <div class="mini-profile">
          <img src="/media/{highlighted.profilePic}" alt="">
        <div>
          <div>{highlighted.name}</div>
          <div>{getTime(highlighted._id, time)}</div>
        </div>
      </div>
      <!-- end mini-profile -->
      {#if highlighted.mediaName != ''}
        <div class="img-container">
          <img class="post-img" src="/media/{highlighted.mediaName}" alt="">
        </div>
      {/if}
      <!-- end optional media -->
      <div class="msg-container">
        {highlighted.message}
      </div>
      <!-- end message -->
      <div class="bottom-controls">
        <div>
          {#if highlighted.userId == localStorage.uid}
            <label for="delete-{highlighted._id}" class="delete-label">Delete</label>
            <input type="button" class="invis" id="delete-{highlighted._id}" on:click={() => deletePost(highlighted._id)} />
          {/if}
        </div>
        <div>
          <label for={highlighted._id} class="like-label">👍</label>
          <input type="checkbox" class="invis" id={highlighted._id} on:click={like} />
        </div>
        <div>
          {highlighted.likes.length}
        </div>
      </div>
      <!-- end controls -->
      <form on:submit|preventDefault id="frmNewComment-{highlighted._id}">
        <div>
          <input type="text" name="message" placeholder="Write comment" autocomplete="off" on:focus={() => fadeInput(highlighted._id, true)} on:blur={() => fadeInput(highlighted._id)}>
          <input type="hidden" name="profilePic" value={$jData.image}>
        </div>
        <div>
          <button on:click={() => comment(highlighted._id, highlighted.userId)}>Post</button>
        </div>
      </form>
      <!-- end reply form -->
      {#if highlighted.comments != ''}
        {#each highlighted.comments.slice(0, count2) as highlightedReply (highlightedReply._id)} 
          <div animate:flip="{{ duration: 200}}" in:scale="{{ duration: 300 }}" out:fly="{{ x: -50, duration: 200}}" class="post reply">
              <div class="mini-profile mini-comment">
                  <img src="/media/{highlightedReply.profilePic}" alt="">
                <div>
                  <div class="name-comment">{highlightedReply.name}</div>
                  <div class="time-comment">{getTime(highlightedReply._id, time)}</div>
                </div>
              </div>
              <!-- end mini-profile -->
              <div class="bottom-controls controls-comment">
                <div>
                {#if highlightedReply.userId == localStorage.uid}
                  <label for="delete-{highlightedReply._id}" class="delete-label">Delete</label>
                  <input type="button" class="invis" id="delete-{highlightedReply._id}" on:click={() => deleteComment(highlighted._id, highlightedReply._id, highlightedReply.userId)} />
                {/if}
                </div>
                <div>
                  <label for={highlightedReply._id} class="like-label">👍</label>
                  <input type="checkbox" class="invis" id={highlightedReply._id} on:click={() => likeComment(highlighted._id, highlightedReply._id)} />
                </div>
                <div>
                  {highlightedReply.likes.length}
                </div>
              </div>
              <!-- end controls -->
              <div class="msg-container msg-comment">
                {highlightedReply.message}
              </div>
              <!-- end message -->
          </div>
        {/each}
        <!-- end replies -->
        {#if highlighted.comments.length > 3}
          <button on:click={()=> { count2 += 3 }}>Show more</button>
        {/if}
      {/if}
    </div>
    <div class="fancy-spacer"></div>
  {/if}
  <!-- end highlighted -->


<div class="posts">
    {#each $jData.posts.slice(0, count) as post (post._id)}
      <div animate:flip="{{ duration: 200}}" in:scale="{{ duration: 300 }}" out:fly="{{ x: -50, duration: 200}}" class="post">
        <div class="mini-profile">
          <!-- {#if post.userId == $jData.userID }
            <img src="/media/{$jData.image}" alt="">
          {:else} -->
            <!-- <img src="/media/{$jData.friends.find((i) => { return i._id == post.userId }).image}" alt=""> -->
            <img src="/media/{post.profilePic}" alt="">
          <!-- {/if} -->
          <div>
            <div>{post.name}</div>
            <div>{getTime(post._id, time)}</div>
          </div>
        </div>
        <!-- end mini-profile -->
        {#if post.mediaName != ''}
          <div class="img-container">
            <img class="post-img" src="/media/{post.mediaName}" alt="">
          </div>
        {/if}
        <!-- end optional media -->
        <div class="msg-container">
          {post.message}
        </div>
        <!-- end message -->
        <div class="bottom-controls">
          <div>
            {#if post.userId == localStorage.uid}
              <label for="delete-{post._id}" class="delete-label">Delete</label>
              <input type="button" class="invis" id="delete-{post._id}" on:click={() => deletePost(post._id)} />
            {/if}
          </div>
          <!-- <div>
            <label for="reply-{post._id}" class="reply-label">Reply</label>
            <input type="button" class="invis" id="reply-{post._id}" on:click={() => { replyTo(post._id) }} />
          </div> -->
          <div>
            <label for={post._id} class="like-label">👍</label>
            <input type="checkbox" class="invis" id={post._id} on:click={like} />
          </div>
          <div>
            {post.likes.length}
          </div>
        </div>
        <!-- end controls -->
        <form on:submit|preventDefault id="frmNewComment-{post._id}">
          <div>
            <input type="text" name="message" placeholder="Write comment" autocomplete="off" on:focus={() => fadeInput(post._id, true)} on:blur={() => fadeInput(post._id)}>
            <input type="hidden" name="profilePic" value={$jData.image}>
          </div>
          <div>
            <button on:click={() => comment(post._id, post.userId)}>Post</button>
          </div>
        </form>
        <!-- end reply form -->
        {#if post.comments != ''}
          {#each post.comments.slice(0, count2) as reply (reply._id)} 
            <div animate:flip="{{ duration: 200}}" in:scale="{{ duration: 300 }}" out:fly="{{ x: -50, duration: 200}}" class="post reply">
              <div class="mini-profile mini-comment">
                  <img src="/media/{reply.profilePic}" alt="">
                <div>
                  <div class="name-comment">{reply.name}</div>
                  <div class="time-comment">{getTime(reply._id, time)}</div>
                </div>
              </div>
              <!-- end mini-profile -->
              <div class="bottom-controls controls-comment">
                <div>
                {#if reply.userId == localStorage.uid}
                  <label for="delete-{reply._id}" class="delete-label">Delete</label>
                  <input type="button" class="invis" id="delete-{reply._id}" on:click={() => deleteComment(post._id, reply._id, reply.userId)} />
                {/if}
                </div>
                <div>
                  <label for={reply._id} class="like-label">👍</label>
                  <input type="checkbox" class="invis" id={reply._id} on:click={() => likeComment(post._id, reply._id)} />
                </div>
                <div>
                  {reply.likes.length}
                </div>
              </div>
              <!-- end controls -->
              <div class="msg-container msg-comment">
                {reply.message}
              </div>
              <!-- end message -->
            </div>
          {/each}
          <!-- end replies -->
          {#if post.comments.length > 3}
            <button on:click={()=> { count2 += 3 }}>Show more</button>
          {/if}
        {/if}
      </div>    
    {/each}   
    <!-- end post -->
    {#if $jData.posts.length > 3}
      <button on:click={loadMore}>Show more</button>
    {/if}
</div>

<!-- end posts -->


<!-- ###################################### -->

<style>

form {
  display: grid;
  grid-template-columns: 20fr 2fr;
  align-items: center;
  grid-column-gap: 0.3rem;
  opacity: 40%;
  -webkit-transition: opacity 0.2s ease-in-out;
  transition: opacity 0.2s ease-in-out;
}

form button {
  width: 100%;
  margin: 0;
}

input {
  height: 2rem;
}

.posts {
  width: 90%;
  margin: 1rem 5%;
}

button {
  color: white;
  background: #575ed8;
  height: 2rem;
  width: 33.3%;
  margin: 0 33.3%;
  padding: 0px 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  outline: none;
}

button:hover {
  cursor: pointer;
}

.post-img{
  /*object-fit: cover;*/
  width: 100%;
  border-radius: 0.5rem;
}

#optionals {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  justify-items: center;
  padding: 0.5rem 0;
}

div.posts{
  display: grid;
  grid-gap: 1rem;
  padding: 1rem 0px;
}

div.post{
  display: grid;
  grid-gap: 0.5rem;
  width: 100%; 
  padding: 1rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
}

#media {
  display: none;
}

#media-label:hover {
  cursor: pointer;
}

/* .img-container{
  padding: 0 10%;
} */

.msg-container{
  padding: 0 0.5rem;
}

.bottom-controls{
  text-align: end;
  display: grid;
  grid-gap: 5px;
  grid-template-columns: auto 20fr 1fr;
}

.bottom-controls > :first-child{
  text-align: left;
  color: #f02849;
}

.delete-label, .reply-label {
  font-weight: 400;
  font-size: 0.7em;
  /* align-self: center; */
}

.reply-label {
  color: #7a7a7a;
  margin-right: 5px;
}

.bottom-controls > :last-child{
  text-align: left;
  font-size: 0.9rem;
  align-self: center;
}

.bottom-controls label{
  cursor: pointer;
}

.like-label{
  position: relative;
  bottom: 0.15rem;
}

.invis{
  display: none;
}

.mini-profile > div > :last-child{
  font-size: 0.9rem;
}

.fancy-spacer {
  height: 2px;
  width: 100%;
  margin-top: 1rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, rgba(126,126,16,0) 0%, rgb(231 158 24) 50%, rgba(126,126,16,0) 100%);
}

#highlighted {
  border: 2px solid rgba(231, 158, 24, 20%);
}

div.reply {
    grid-template-areas:
    'profile profile profile profile controls'
    'msg msg msg msg msg';
    align-items: start;
}

.mini-comment {
  grid-area: profile;
}

.mini-comment > img {
  height: 2.2rem;
  width: 2.2rem;
}

.time-comment {
  font-size: 0.3rem;
}

.mini-comment > div > :last-child{
  font-size: 0.8rem;
}

.controls-comment {
  grid-area: controls;
  grid-template-columns: 4fr 2fr 1fr;
}

.msg-comment {
  grid-area: msg;
}

.name-comment {
  font-size: 0.9rem;
}

#close-highlight {
  color: #cf0022;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 1rem;
  cursor: pointer;
}

</style>