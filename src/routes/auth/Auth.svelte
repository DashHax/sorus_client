<script lang="ts">
    import { onMount, tick } from "svelte";
    import {} from "svelte/transition";
    import { replace } from "svelte-spa-router";

    import axios from "../../system/api";

    import TextField from "smelte/src/components/TextField/TextField.svelte";
    import Button from "smelte/src/components/Button/Button.svelte";

    import FaceCamera from "../../components/FaceCamera.svelte";

    let pageVisible:boolean = false;

    type FaceResult = {
        imageURL:string,
        embedding:number[]
    }

    let face:FaceResult = null;
    let loginPin:string = null;

    async function performLogin() {
        window.progress(true);

        if (!loginPin) {
            window.notify("Please enter your login PIN!");
            return;
        }

        if (!face || !face.embedding) {
            window.notify("Please take a face photo for verification!");
            return;
        }

        try {
            let payload = { pin: loginPin, face: face.embedding };
            let response = await axios.post("/checkin/login", payload);
            let result = response.data;

            if (result.status == "success") {
                localStorage["login_pin"] = loginPin;
                localStorage["token"] = result.token;
                localStorage["user.id"] = result.user.id;
                localStorage["user.name"] = result.user.name;
                
                window.notify("Successfully logged in! You can proceed by checking in!");
                replace("/dashboard");
            } else {
                window.notify("Something wrong happened while logging in! " + result.error);
            }
        } catch (error) {
            window.notify("Fatal error while logging in! " + error.message);
        }
        window.progress(false);
    }

    if (localStorage["login_pin"]) {
        replace("/dashboard")
    } else {
        pageVisible = true;
    }
</script>

<div class="auth">
    {#if !pageVisible}
        <h5 class="text-center m-4">
            Loading...
        </h5>
    {:else}
        <div class="content p-1">
            <h5 class="text-center mb-4">
                Login to SORUS
            </h5>
            <TextField label="Login PIN" hint="9-digit pin given by the frontliner during PUI Registration" bind:value={loginPin}/>
            
            <div class="separator my-2"></div>
            <FaceCamera bind:capturedFace={face}/>
            <div class="separator my-4"></div>

            <Button block on:click={performLogin}>Login</Button>
        </div>
    {/if}
</div>

<style lang="scss">
    .auth {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;

        .content {
            width: 768px;
            max-width: 90vw;
            max-height: 95vh;
        }
    }
</style>