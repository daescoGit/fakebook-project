<script>
	import Nav from "./Nav.svelte"
	import MainLeft from "./MainLeft.svelte"
	import MainRight from "./MainRight.svelte"
	import MainMiddle from "./MainMiddle.svelte"
	
	import {jData} from "./store.js"

	// PASS JWT IN HEADERS OR POST INSTEAD OF GET
	// const getAllDataForThisUser = async () => {
	// 	let connect = await fetch("http://localhost/getAllDataForThisUser")
	// 	let resData = await connect.json()
	// 	$jData.unreadMessages = [...resData.unreadMessages, ...$jData.unreadMessages]
	// 	console.log(jData)
	// }
	
	// setInterval( () => { getAllDataForThisUser() }, 5000 )

	// WITH SSE
	// PASS JWT IN HEADERS OR POST INSTEAD OF GET
	let eventResource = new EventSource("http://localhost/data?jwt="+localStorage.jwt)
	// alt: use .onmessage
	eventResource.addEventListener("message", function(event){
		let resData = JSON.parse(event.data) // parse text to obj
		$jData.unreadMessages = [...resData.unreadMessages, ...$jData.unreadMessages]
		$jData.unreadPosts = [...resData.unreadPosts, ...$jData.unreadPosts]
		//console.log(event.data)
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