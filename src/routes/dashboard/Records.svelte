<script lang="ts">
    import { onMount } from "svelte";
    import { pop } from "svelte-spa-router";
    import Button from "smelte/src/components/Button/Button.svelte";

    import axios from "../../system/api";

    type Record = {
        time: string, lat: number, long: number, inbound: boolean
    }

    let records:Record[] = [];

    async function loadRecords() {
        window.progress(true);
        try {
            let pin = localStorage["login_pin"],
                token = localStorage["token"]
            let response = await axios.get("/checkin/view/" + token + "/" + pin);
            let result = response.data;

            if (result.status == "success") {
                records = result.checkins;
            } else {
                window.notify("Could not load check-in records! " + result.error);
            }
        } catch (error) {
            window.notify("Fatal error while loading check-in records! " + error.message);
        }
        
        window.progress(false);
    }

    onMount(async () => {
        await loadRecords();
    })
</script>

<div class="records">
    <div class="header mb-4 flex">
        <Button text on:click={() => pop()}><i class="material-icons">chevron_left</i></Button>
    </div>

    <h5 class="mx-4">Check-in Records</h5>

    <div class="lists">
        {#if records && records.length > 0}
            {#each records as rec}
                <div class="record">
                    <div class="info">
                        <i class="material-icons">calendar_today</i> {new Date(rec.time).toLocaleString()}
                    </div>
                    <div class="info"><i class="material-icons">location_on</i> {rec.lat.toFixed(8)}, {rec.long.toFixed(8)} 
                        <span class="mx-2"></span><Button small flat target="_blank" href="https://www.google.com/maps/place/{rec.lat},{rec.long}&zoom=35">View on Maps</Button></div>

                    <div class="info">
                        Valid: <strong><span class="ml-2" style="color: {rec.inbound ? "green" : "#DD0000"};">{rec.inbound ? "Yes" : "No (checked-in at outside specified region)"}</span></strong>
                    </div>
                </div>
            {/each}
        {:else}
            <label class="p-4 text-center" style="color: #888;">No records found...</label>
        {/if}
    </div>
</div>

<style lang="scss">
 .records {
    height: 100vh;
    display: flex;
    flex-direction: column;

    .lists {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden auto;;
        border: 1px solid #ccc;

        .record {
            display: flex;
            flex-direction: column;
            padding: 1em;

            border-bottom: 1px solid #ccc;

            .info {
                display: flex;
                color: #333;
                align-items: center;

                &:not(:first-child) {
                    margin-top: 0.5rem;
                }

                .material-icons {
                    font-size: 1em;
                    color: #888;
                    margin-right: 0.5rem;
                }
            }
        }
    }
 }
</style>