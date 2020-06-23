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

.create-post{
  width: 100%; 
  padding: 1rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
}

#optionals {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  justify-items: center;
  padding: 0.5rem 0;
}

.photo{
  color: #45bd62;
}

.tag{
  color: #1da1f2;
}

.feel{
  color: #f7b928;
}

#media {
  display: none;
}

#media-label:hover {
  cursor: pointer;
}

</style>