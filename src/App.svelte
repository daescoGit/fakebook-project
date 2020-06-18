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
			//$jData.unreadMessages = [...resData.unreadMessages, ...$jData.unreadMessages]
			console.log(resData.friendPosts.length)
			console.log($jData.friendPosts.length)
			// isolate unread posts from list
			// downside of this approach = async stores across devices
			if(resData.friendPosts.length > $jData.friendPosts.length){
				let dif = resData.friendPosts.length-$jData.friendPosts.length
				console.log(dif)
				let newPosts = resData.friendPosts.slice(resData.friendPosts.length-dif)
				console.log(newPosts)
				$jData.unreadPosts = [...newPosts, ...$jData.unreadPosts]
			}

			$jData.unreadPosts = resData.friendPosts
			$jData.friends = resData.friends
			$jData.posts = resData.myPosts
			//console.log(resData.unreadPosts)
			// not with sse?
			$jData.userName = resData.name

		}catch(err){
			console.log("SSE error:", err)
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