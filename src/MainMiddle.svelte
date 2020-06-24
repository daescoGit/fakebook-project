<script>
  import CreatePost from './CreatePost.svelte'
  import PostList from './PostList.svelte'
</script>

<!-- ###################################### -->

<div class="main-middle">

    <CreatePost />
    <PostList />

</div>

<!-- ###################################### -->

<style>

div.main-middle{
  position: absolute;
  top: 5rem;
  left: 25vw;
  width: 50vw;
  padding: 0 2rem;
}

</style>