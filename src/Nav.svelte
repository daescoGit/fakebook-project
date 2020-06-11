<script>
  import {jData} from "./store.js"
  $: unreadMessagesCount = $jData.unreadMessages.length

  // MAKE WITH AJAX
  // setTimeout( function(){
  //   let unreadMessage = {"id":2, "message":"c"}
  //   // method 1 of updating DOM
  //   //$jData.unreadMessages.push(unreadMessage)
  //   //$jData = $jData
    
  //   // method 2 of updating DOM
  //   $jData.unreadMessages = [unreadMessage, ...$jData.unreadMessages]

  // }, 5000)
</script>

<!-- ###################################### -->
<nav>
    <div class="left">
        <div class="logo">
        <i class="fas fa-crow"></i> fakebook
        </div>
        <div>
        <form>
            <div>
            <i class="fas fa-search"></i>
            <input type="text">
            </div>
        </form>
        </div>
    </div>

    <div class="middle">
        <div class="active">
        <i class="fas fa-home"></i>{$jData.unreadPosts.length > 0 ? 'New posts': ''}
        </div>
        <div>
        <i class="fas fa-video"></i>
        </div>
        <div>
        <i class="fas fa-shopping-basket"></i>
        </div>            
    </div>

    <div class="right">
        <div>
        USERNAME        
        </div>
        <div>
        <i class="fas fa-plus-circle"></i>
        </div>
        <div>
        <i class="far fa-comment-alt"></i>
        <div class="chat-counter">{unreadMessagesCount}</div>       
        </div>
        <div>
        <i class="far fa-bell"></i> 
        <div class="notification-counter">5</div>         
        </div>
        <div>
        <i class="fas fa-user"></i>      
        </div>                  
    </div>
</nav>

<!-- ###################################### -->

<style>

nav{
  display: grid;
  grid-template-columns: 25fr 40fr 10fr;
  grid-gap: 2rem;

  position: fixed;
  top: 0px;
  left: 0px;
  width: 100vw;
  height: 4rem;
  padding: 0px 2vw;
  font-size: 1.5rem;
  color: #555;
  background: white;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.3);
  z-index: 1;
}
nav div.active{
  border-bottom: 0.2rem solid #1da1f2;
}
nav div.left{
  display: grid;
  grid-template-columns: 5fr 10fr;
  grid-gap: 1rem;
  align-items: center;
}
nav div.left div.logo{
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  grid-gap: 0.5rem;
  font-weight: 400;
  color: #1da1f2;
}
nav div.left form > div{
  position: relative;
}
nav div.left form > div > i{
  position: absolute;
  right: 0.5rem;
  margin-top: 0.8rem;
  font-size: 1rem;
}
nav div.left form > div > input{
  padding-right: 1.8rem;
}
nav div.middle{
  display: grid;
  grid-template-columns: 10fr 10fr 10fr;
  justify-items: center;
  grid-gap: 1rem;
  align-items: center;
}
nav div.middle > div{
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  align-items: center;

  position: relative;
  width: 100%;
  height: 100%;
}
nav div.right{
  display: grid;
  grid-template-columns: 8fr 8fr 1fr 1fr 8fr;
  align-items: center;
  grid-gap: 2rem;
  align-items: center;
}
nav div.right > div{
  position: relative;
}
nav div.right > div:last-child{
  text-align: right;
}
nav div.chat-counter{
  display: grid;
  justify-content: center;
  align-content: center;

  position: absolute;
  top: -0.6rem;
  right: -1rem;

  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background: #f02849;
  border-radius: 50%;
}
nav div.notification-counter{
  display: grid;
  justify-content: center;
  align-content: center;

  position: absolute;
  top: -0.6rem;
  right: -1rem;

  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background: #f02849;
  border-radius: 50%;
}

</style>