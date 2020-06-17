<script>
    import { jData } from './store.js'
    import { addChatWindow } from './ChatContainer.svelte'
    $: friends = $jData.friends

    const showChatWindow = () => {
        addChatWindow()
    }
</script>

<!-- ###################################### -->

<div id="a" class="main-right">

    {#each friends as friend}
        <div class="mini-profile" on:click="{showChatWindow}">
            <img src="https://source.unsplash.com/random/50x55" alt="">
            <div>
                <div>{ friend.name }</div>
                <div>STATUS</div>
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
  /* right: 0; */
  /* bottom: 0; */

  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 0.5rem;

  width: 100%;
  /* height: calc(100vh - 6rem); */
  height: calc(100vh - 5.5rem);
  /* background: rgba(0, 0, 0, 0.5); */

  /* overflow: hidden; */
  overflow-y: scroll;
  z-index: 1;
}

div.mini-profile {
    cursor: pointer;
}

</style>