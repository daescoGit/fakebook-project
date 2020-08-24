<script>
	import Nav from "./Nav.svelte"
	import MainLeft from "./MainLeft.svelte"
	import MainRight from "./MainRight.svelte"
	import MainMiddle from "./MainMiddle.svelte"
	import ChatContainer from "./ChatContainer.svelte"
	import { onDestroy } from "svelte"
	
	import { jData } from "./store.js"

	if(!localStorage.jwt){location.href = "/login"}else{
		//regular fetch? to get user + use params instead of token to not refresh token?
		// use token id as param?

		// let uID = JSON.stringify($jData.userID)
		// console.log(uID)

		// SSE
		// HOW TO PASS JWT IN HEADERS INSTEAD OF GET WITH SSE?

		let eventResource = new EventSource(`/sse-data/${localStorage.jwt}`)
		// alt: use .onmessage
		eventResource.addEventListener("message", function(event){
			try {
				//console.log(event.data)
				let resData = JSON.parse(event.data) // parse text to obj

				$jData.userName = resData.name
				$jData.image = resData.image
				$jData.userID = resData._id
				$jData.friendRequests = resData.friendRequests
				$jData.friends = resData.friends
				$jData.posts = resData.posts.sort(function (a, b){
					// timestamp is contained in the first 4 bytes of mongo id
					let p1 = new Date(parseInt( a._id.toString().substring(0,8), 16 ) * 1000)
					let p2 = new Date(parseInt( b._id.toString().substring(0,8), 16 ) * 1000)
					return p2 - p1
					}
				)
				$jData.unreadPosts = resData.unreadPosts
				$jData.messages = resData.myMessages
				$jData.unreadMessages = resData.unreadMessages
				$jData.onlineFriends = resData.onlineFriends
				$jData.unreadComments = resData.unreadComments

				//console.log(eventResource.readyState)
			}catch(err){
				console.log("SSE error:", err)
			}
		})

		onDestroy(() => {
			eventResource.close()
		})

	}

	let time = new Date()
	setInterval(() => {
		time = new Date();
	}, 30000);
	
	function getTime(id, time, format){
		// timestamp is contained in the first 4 bytes of mongo id
		let timestamp = id.toString().substring(0,8)
		let date = new Date( parseInt( timestamp, 16 ) * 1000 )
		let dif = time.getTime() - date.getTime()
		let seconds = dif / 1000
		let minutes = seconds / 60
		let hours = minutes / 60
		let days = hours / 24

		function timeFormatter(t, f) {
			t = Math.floor(t)
			return (t == 1 ? t+' '+f+' ago' : t+' '+f+'s ago')
		}
		if(format == 1){
			if(days >= 1){
				return Math.floor(days)+'d'
			}else if(hours >= 1){
				return Math.floor(hours)+'h'
			}else if(minutes >= 1){
				return Math.floor(minutes)+'m'
			}else{	
				return 'now'
			}
		}else{
			if(days >= 1){
				return timeFormatter(days, 'day')
			}else if(hours >= 1){
				return timeFormatter(hours, 'hour')
			}else if(minutes >= 1){
				return timeFormatter(minutes, 'minute')
			}else{	
				return 'Just now'
			}
		}
		// let formattedDate = date.toDateString()
		// let formattedHours = date.getHours()
		// let formattedMinutes = date.getMinutes()
		// if(formattedMinutes < 10){formattedMinutes = '0'+formattedMinutes}
		// return formattedDate+' - '+formattedHours+':'+formattedMinutes
  	}
</script>

<!-- ###################################### -->

<main>
	<Nav {getTime} {time}/>
	<MainLeft />
	<MainRight />
	<MainMiddle {getTime} {time}/>
	<ChatContainer {getTime} {time}/>
</main>

<!-- ###################################### -->

<style>

</style>