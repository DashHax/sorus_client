<script lang="ts">
    import { onMount } from "svelte";
    import { replace } from "svelte-spa-router";
    import axios from "../system/api";

    async function logout() {
        try {
            let pin = localStorage["login_pin"],
                token = localStorage["token"];
            let payload = { pin, token };

            let resp = await axios.post("/checkin/exit", payload);
            let result = resp.data;

            if (result.status == "success") {
                localStorage.removeItem("user.name");
                localStorage.removeItem("user.id");
                localStorage.removeItem("token");
                localStorage.removeItem("login_pin");

                window.notify("You had successfully finished your quarantine period. Thank you for your cooperation!");
                replace("/");
            } else if (result.status == "failed") {
                window.notify(result.message);
                replace("/dashboard")
            }
        } catch (error) {
            window.notify("Could not logout! " + error.message);
            replace("/dashboard")
        }
    }

    onMount(async () => {
        await logout();
    })
</script>

<div class="logout p-4 text-center">
    Logging you out...
</div>

<style lang="scss">

</style>