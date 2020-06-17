<script context="module">
// context="module" = require once in php (save/remember across app/components)
    export const addChatWindow = () => {
        console.log('showing chat window')
    }
</script>

<!-- ###################################### -->
<!-- mb. loop over individual chat box components -->

<div class="chat-container">
    chat here
</div>

<!-- ###################################### -->

<style>
    div.chat-container {
        height: 3rem;
        width: 3rem;
        position: fixed;
        bottom: 0;
        right: 0;
        background: red;
    }
</style>