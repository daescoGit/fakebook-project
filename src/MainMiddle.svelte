<script>
  import CreatePost from './CreatePost.svelte'
  import PostList from './PostList.svelte'
  export let getTime
  export let time
</script>

<!-- ###################################### -->

<div class="main-middle">

    <CreatePost />
    <PostList {getTime} {time}/>

</div>

<!-- ###################################### -->

<style>

div.main-middle{
  position: absolute;
  margin: 5rem 25% 0;
  /* left: 25vw; */
  width: 50vw;
  padding: 0 5vw;
}

</style>