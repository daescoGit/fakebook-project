<script>
  import { jData } from './store.js'

  async function post() {
    let form = new FormData(document.querySelector("#frmNewPost"))
    let connection = await fetch("posts", {
      method: "POST",
      headers: {
      'X-Custom-Header': localStorage.jwt
      },
      body: form
    })
    let response = await(connection).text()
    document.querySelector("#frmNewPost").reset()
  }
</script>

<!-- ###################################### -->

<div class="main-middle">
    <div class="create-post">
      <div>
        <form on:submit|preventDefault id="frmNewPost">
          <input id="msg" type="text" name="message" placeholder="Hey {$jData.userName}, how's life?">
          <div id="optionals">
            <label for="media" id="media-label"><i class="far fa-image photo"></i> Image/Video</label>
            <input type="file" name="media" id="media">
            <div><i class="fas fa-user-tag tag"></i> Tag Friend</div>
            <div><i class="fas fa-shoe-prints feel"></i> Feeling Lucky</div>
          </div>
          <button on:click={post}>Post</button>
        </form>
      </div>

    </div>
    <!-- end create-post -->

    <div class="posts">

      <div class="post">

        <div class="mini-profile">
          <img src="https://source.unsplash.com/random/51x58" alt="">
          <div>
            <div>Jesper Hensen</div>
            <div>Time or something / title</div>
          </div>
        </div>
        <!-- end mini-profile -->
        <div>
          <img class="post-img" src="https://source.unsplash.com/random/600x400" alt="">
        </div>
        <!-- end optional media -->
        <div>
          Learn how to create campaigns on Google and Facebook to boost your brand or business.
          In this course, Arantxa and Guillermo will teach you how to create digital marketing campaigns 
          on Google Ads and Facebook and Instagram Ads, considered today the most important platforms 
          in the field of digital marketing.
        </div>
        <!-- end message -->
      </div>        
      <!-- end post -->
    </div>
    <!-- end posts -->
</div>

<!-- ###################################### -->

<style>

div.main-middle button {
  color: white;
  background: #1da1f2;
  height: 2rem;
  width: 4rem;
  padding: 0px 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
}

div.main-middle button:hover {
  cursor: pointer;
}

div.main-middle{
  position: absolute;
  top: 5rem;
  left: 25vw;
  width: 50vw;
  padding: 0 2rem;
}
div.main-middle .create-post{
  width: 100%; 
  padding: 1rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
}
div.main-middle .post-img{
  /*object-fit: cover;*/
  width: 100%;
}

div.main-middle .create-post form input{
  width: 100%;
  background: rgba(0, 0, 0, 0.05);
}
#optionals {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  justify-items: center;
  padding: 0.5rem 0;
}
div.main-middle .photo{
  color: #45bd62;
}
div.main-middle .tag{
  color: #1da1f2;
}
div.main-middle .feel{
  color: #f7b928;
}
div.main-middle div.posts{
  display: grid;
  grid-gap: 1rem;
  padding: 1rem 0px;
}
div.main-middle div.post{
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

</style>