<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import Button from "smelte/src/components/Button/Button.svelte";
    import ProgressCircular from "smelte/src/components/ProgressCircular/ProgressCircular.svelte";

    import { GeoLocation } from "../../services/geo.service";
    import { pop, replace } from "svelte-spa-router";
    import FaceCamera from "../../components/FaceCamera.svelte";
    import axios from "../../system/api";

    let location = null;
    let geoSub = GeoLocation.subscribe(val => {
        location = val;
        console.log("New Location!");
    })

    let snappedFace = null;

    let listenIris:boolean = false;
    let started:boolean = false;

    let timerID = null;
    const timeout = 10 * 1000;
    let counter = 0;
    $:progress = counter / timeout;

    const col_limit = 500;

    let ar = {
        left: [],
        right: []
    }

    function buildHistogram(nums:number[], spacing = 25) {
        let histogram = {};
        
        let mult:number;
        for (let v of nums) {
            mult = 1;

            while (v > mult * spacing) {
                mult += 1;
            }

            let lo = spacing * (mult - 1);
            let hi = spacing * mult;
            let lbl = `${lo}:${hi}`;

            histogram[lbl] = histogram[lbl] + 1 || 0;
        }

        return histogram;
    }

    function processAr(value:number, left = true) {
        if (left) {
            ar.left = [...ar.left, value];
        } else {
            ar.right = [...ar.right, value];
        }
    }

    function subscribeEyeAR(e:CustomEvent) {
        let { left, right } = (e.detail as { left: number, right: number});
        processAr(left);
        processAr(right, false);
    }

    function onEndTimer() {
        listenIris = false;
        started = false;

        window.faceCamera.snap((e) => {
            console.log(e);
        })

        let l_hist = buildHistogram(ar.left);
        let r_hist = buildHistogram(ar.right);

        window.faceCamera.stop()

        let payload = {
            id: localStorage["login_pin"],
            token: localStorage["token"],
            location: location,
            histograms: { left: l_hist, right: r_hist },
            face: snappedFace.embedding
        }

        window.progress(true);

        axios.post("/checkin/submit", payload).then(response => {
            let result = response.data;

            if (result.status == "success") {
                localStorage["token"] = result.token;
                replace("/dashboard");
                if (result.isBounded) {                
                    window.notify("You had been checked in!");
                } else {
                    window.notify("Seems that you've been checking in out from your specified region. Please stay at home. Failure to do so will result in compound of RM1000");
                }
            } else {
                window.notify("Something is wrong while checking in. Please contact the frontliner. Error: " + result.error);
            }
            window.progress(false);

        }).catch(error => {
            window.progress(false);
            window.notify("Could not check in! Please contact the frontliner. Error: " + error);
        })
    }

    function startTimer() {
        let dur = 1000;
        function count() {
            counter += dur;

            if (counter < timeout) {
                timerID = setTimeout(count, dur);
            } else {
                onEndTimer();
            }
        }
        timerID = setTimeout(count, dur);
    }

    function startCheckin() {
        counter = 0;
        listenIris = true;
        started = true;
        window.faceCamera.start();
        ar = {
            left: [],
            right: []
        }
        startTimer();

    }

    onDestroy(() => {
        geoSub();
    })
</script>

<div class="checkin">
    <div class="header mb-4 flex">
        <Button text on:click={() => pop()}><i class="material-icons">chevron_left</i></Button>

        <div class="icons">
            <div class="icon">
                <i class="material-icons">gps_fixed</i>
                {location ? location.acc.toFixed(2) : 0} meter
            </div>
        </div>
    </div>

    <FaceCamera autorun={started} snapButton={false} obtainIris={listenIris} on:eyeaspectratio={subscribeEyeAR} bind:capturedFace={snappedFace}/>

    <div class="status p-4">

        {#if !started}        
            <p>Status: Ready to Check-in.</p>
            <p><strong>Note: Check-in process takes around 10 seconds.</strong></p>
        {:else}
            <p>Status: {Math.floor(counter / 1000)} seconds elapsed...</p>
            <div class="mt-4 flex justify-center w-100">
                <ProgressCircular progress={Math.floor(progress * 100)}/>
            </div>
        {/if}
    </div>

    <Button color="primary" on:click={startCheckin} disabled={started}>Check-In!</Button>
</div>

<style lang="scss">
    .checkin {
        height: 100vh;
        display: flex;
        flex-direction: column;

        .header {
            .icons {
                display: flex;
                margin-left: auto;
                padding: 1em;

                .icon {
                    display: flex;
                    align-items: center;

                    font-size: 1em;
                    color: #888;

                    .material-icons {
                        font-size: 1.2em;
                        margin-right: 0.5em;
                        color: #888;
                    }
                }
            }
        }
    }
</style>