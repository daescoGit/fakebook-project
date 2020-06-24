<script>
    import { jData } from './store.js'

    async function sendMsg(friendID) {
        let form = new FormData(document.querySelector(`#frmNewMsg-${friendID}`))
        let connection = await fetch("chat-message", {
            method: "POST",
            headers: {
                'X-Custom-Header': localStorage.jwt
            },
            body: form
        })
        let response = await(connection).text()
        document.querySelector(`#frmNewMsg-${friendID}`).reset()
    }
</script>

<!-- ###################################### -->

<div class="chat-container">
{#each $jData.friends as friend }
    <div class="chat-box" id={friend._id}>
        <div class="chat-top">
            <input disabled class="chat-with" value="Chat with { friend.name }">
            <button class="close" on:click={document.getElementById(friend._id).setAttribute("style", "display:none;")}>X</button>
        </div>
        <div class="chat-window">
            { #each $jData.messages.filter(function (e) {
                return e.senderId == friend._id && e.receiverId == $jData.userID || e.senderId == $jData.userID && e.receiverId == friend._id
            }) as message }
                <div class="output"><p><strong>{message.name}</strong>: {message.message}</p></div>
            { /each }
            <!-- <div class="feedback"></div> -->
        </div>   
        <!-- <input id="handle" type="hidden" value={ $jData.userName }>  -->
        <form on:submit|preventDefault id="frmNewMsg-{friend._id}">
            <input class="message" name="message" type="text" placeholder="Message" autocomplete="off"> 
            <input name="senderId" type="hidden" value={$jData.userID}> 
            <input name="receiverId" type="hidden" value={friend._id}> 
            <input name="name" type="hidden" value={$jData.userName}> 
            <button class="send" on:click={sendMsg(friend._id)}>Send</button>
        </form>
        
    </div>
{/each}
</div>

<!-- ###################################### -->

<style>
.chat-top{
    display: grid;
    position: fixed;
    grid-template-columns: 11fr 1fr;
    grid-column-gap: 5px;
}

.close{
    width: auto;
    background: #989898;
    padding: -20px 8px;
    height: 70%;
    font-size: 0.8rem;
    align-self: center;
}

div.chat-container {
    display: grid;
    grid-column-gap: 0.5rem;
    grid-auto-flow: column;
    grid-auto-columns: min-content;
    justify-content: end;
    width: 100vw;
    position: fixed;
    bottom: 0;
    right: 0;
    padding: 0.5rem;
}

.chat-box{
    display: none;
    width: 20rem;
    background-color: #fff;
    border: 1px solid #ddd;
    box-shadow: 1px 3px 5px rgba(0,0,0,0.05);
    -webkit-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.3);
    -moz-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.3);
    box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.3);
    border: 5px solid #fff;
    border-top: none;
}

.chat-window{
    padding-top: 2.7rem;
    height: 15rem;
    overflow: auto;
    background: #f9f9f9;
}

.output p{
    font-size: 1rem;
    padding: 0.2rem 0px;
    margin: 0 0.5rem;
    /* border-bottom: 1px solid #e9e9e9; */
    color: #555;
}

.feedback p{
    color: #aaa;
    padding: 14px 0px;
    margin: 0 20px;
}

.output strong{
    color: #575ed8;
}

label{
    box-sizing: border-box;
    display: block;
    padding: 10px 20px;
}

input{
    padding: 10px 20px;
    box-sizing: border-box;
    background: #eee;
    border: 0;
    display: block;
    width: 100%;
    background: #fff;
    border-bottom: 1px solid #eee;
    font-size: 16px;
    border-radius: 0;
}

button{
    background: #575ed8;
    color: #fff;
    font-size: 18px;
    border: 0;
    padding: 8px;
    width: 100%;
    cursor: pointer;
}

.chat-with{
    font-weight: 400;
}

.message{
    border: 1px solid #dedede;
}

::-webkit-scrollbar-track {
  margin: 5px 0;
}

</style>