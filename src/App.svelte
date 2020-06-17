<script>
	import Nav from "./Nav.svelte"
	import MainLeft from "./MainLeft.svelte"
	import MainRight from "./MainRight.svelte"
	import MainMiddle from "./MainMiddle.svelte"
	
	import { jData } from "./store.js"

	// SSE
	// HOW TO PASS JWT IN HEADERS INSTEAD OF GET WITH SSE?
	let eventResource = new EventSource("/sse-data?jwt="+localStorage.jwt)
	// alt: use .onmessage
	eventResource.addEventListener("message", function(event){
		try {
			let resData = JSON.parse(event.data) // parse text to obj
			//if(resData.unreadMessages != )
			$jData.unreadMessages = [...resData.unreadMessages, ...$jData.unreadMessages]
			$jData.unreadPosts = resData.unreadPosts
			$jData.friends = resData.friends
			$jData.posts = resData.myPosts
			//console.log(resData.unreadPosts)
			// not with sse?
			$jData.userName = resData.name

		}catch(err){
			console.log("SSE connection error")
		}
	})
</script>

<!-- ###################################### -->

<main>
	<Nav />
	<MainLeft />
	<MainRight />
	<MainMiddle />
</main>

<!-- ###################################### -->

<style>

</style>