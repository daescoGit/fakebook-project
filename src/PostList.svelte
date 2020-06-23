<script>
  import { jData } from './store.js'

  let count = 3

  function loadMore(){
    count += 3
  }

  async function like() {
    let status = this.checked
    let postID = this.getAttribute("id")
    let postData = [{status}, {postID}]
    //console.log(postData)
    try{
      let connection = await fetch("like-post", {
        method: 'POST',       
        headers: {
        'X-Custom-Header': localStorage.jwt,
        'X-Custom-Header-Data': JSON.stringify(postData)
        },
      })
      let response = await(connection)
      //console.log(response.status)
    }catch(err){
      console.log("error updating"); return
    }
  }

  function getTime(id){
    // timestamp is contained in the first 4 bytes of mongo id
    let timestamp = id.toString().substring(0,8)
    let date = new Date( parseInt( timestamp, 16 ) * 1000 )
    let formattedDate = date.toDateString()
    let formattedHours = date.getHours()
    let formattedMinutes = date.getMinutes()
    if(formattedMinutes < 10){formattedMinutes = '0'+formattedMinutes}
    return formattedDate+' - '+formattedHours+':'+formattedMinutes
  }

</script>

<!-- ###################################### -->

<div class="posts">
    {#each $jData.posts.slice(0, count) as post}
    <div class="post">
        <div class="mini-profile">
            <img src="https://source.unsplash.com/random/51x58" alt="">
            <div>
            <div>{post.name}</div>
            <div>{getTime(post._id)}</div>
            </div>
        </div>
        <!-- end mini-profile -->
        {#if post.mediaName != ''}
            <div id="img-container">
            <img class="post-img" src="/media/{post.mediaName}" alt="">
            </div>
        {/if}
        <!-- end optional media -->
        <div id="msg-container">
            {post.message}
        </div>
        <!-- end message -->
        <div id="likes">
            <label for={post._id} id="like-label">👍</label>
            <input type="checkbox" class="btn-like" id={post._id} on:click={like} />
            {post.likes.length}
        </div>
        <!-- end like container -->
    </div>     
    {/each}   
    <!-- end post -->
    <button on:click={loadMore}>Show more</button>
</div>

<!-- end posts -->


<!-- ###################################### -->

<style>
button {
  color: white;
  background: #1da1f2;
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

.create-post form input{
  width: 100%;
  background: rgba(0, 0, 0, 0.05);
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
  grid-gap: 1rem;
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

#img-container{
  padding: 0 10%;
}

#msg-container{
  padding: 0 5%;
}

#likes{
  text-align: end;
}

#like-label{
  position: relative;
  bottom: 0.15rem;
}

#like-label:hover{
  cursor: pointer;
}

.btn-like{
  display: none;
}

</style>