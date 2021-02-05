<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import { fly } from "svelte/transition";
    import { sineInOut } from "svelte/easing";
    import { push, replace } from "svelte-spa-router";

    import { GeoLocation, startGeolocation, stopGeolocation } from "../../services/geo.service";

    let trns = (opt = null) => {
        return {
            y: -8,
            duration: opt ? (opt.dr || 1500) : 1500,
            delay: opt ? (opt.dl || 0) : 0,
            easing: sineInOut
        }
    }

    let actions = () => document.querySelectorAll(".dashboard .actions .action");

    function clickAction(e:MouseEvent) {
        let page = (e.target as HTMLButtonElement).dataset.page;

        push(page);
    }

    onMount(async () => {
        await tick();
        startGeolocation();
        actions().forEach(e => {
            e.addEventListener("click", clickAction);
        })
    });

    onDestroy(() => {
        actions().forEach(e => {
            e.removeEventListener("click", clickAction);
        })
    })
</script>

<div class="dashboard">

    <div class="header flex flex-col items-center pt-8" >
        <div class="logo flex items-center" in:fly|local={trns()}>
            <img src="images/sorus-logo-128.png" alt="SORUS Logo" style="width: 64px; height: 64px;">
            <h4 class="ml-4" style="color: #555; letter-spacing: 4px;">SORUS</h4>
        </div>

        <h4 class="text-center mt-8" style="color: #555; text-transform: uppercase;" in:fly|local={trns({ dl: 500 })}>Hello, {localStorage["user.name"]}!</h4>

        <p class="mt-4 text-center uppercase" style="color: #333; letter-spacing: 2px;" in:fly|local={trns({ dl: 1000 })}>
            This is your dashboard
        </p>
    </div>

    <div class="actions mt-8" in:fly|local={trns({ dl: 1500 })}>
        <div class="action" data-page="/checkin">
            Check-In
        </div>
        <div class="action" data-page="/records">
            Records
        </div>
        <div class="action" data-page="/logout">
            Logout
        </div>
    </div>

</div>

<style lang="scss">
    .dashboard {
        display: flex;
        flex-direction: column;

        .header {
            .logo {
                width: fit-content;
                
            }
        }

        .actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1em;
            width: 600px;
            max-width: 90vw;
            align-self: center;
            justify-items: center;
            align-items: center;

            .action {
                width: 200px;
                height: 200px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;

                font-size: 1.15rem;
                text-transform: uppercase;
                color: #555;

                border: 1px solid #ccc;
                border-radius: 5px;

                cursor: pointer;
                transition: all 200ms ease-in-out;

                &:hover { box-shadow: 0 -6px 8px -3px inset rgba(0, 0, 0, 0.15); };
                &:active { box-shadow: 3px 3px 8px inset rgba(0, 0, 0, 0.15), -3px -3px 8px inset rgba(0, 0, 0, 0.15);  background-color: #efefef;}
            }
        }
    }
</style>