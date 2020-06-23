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
			$jData.userName = resData.name
			$jData.userID = resData._id
			$jData.unreadPosts = resData.unreadPosts
			$jData.friendRequests = resData.friendRequests
			//$jData.friendPosts = resData.friendPosts
			$jData.friends = resData.friends
			$jData.posts = resData.posts.sort(function (a, b){
				// timestamp is contained in the first 4 bytes of mongo id
				let p1 = new Date(parseInt( a._id.toString().substring(0,8), 16 ) * 1000)
				let p2 = new Date(parseInt( b._id.toString().substring(0,8), 16 ) * 1000)
				return p2 - p1
				}
			)

			// isolate unread posts from list (client cache instead of bloated db)
			// downside of this approach = async stores across devices
			// if(resData.friendPosts.length > $jData.friendPosts.length){
			// 	let dif = resData.friendPosts.length-$jData.friendPosts.length
			// 	console.log(dif)
			// 	let newPosts = resData.friendPosts.slice(resData.friendPosts.length-dif)
			// 	console.log(newPosts)
			// 	$jData.unreadPosts = [...newPosts, ...$jData.unreadPosts]
			// }

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