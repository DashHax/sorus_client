<script lang="ts">
    export let capturedFace = { imageURL: null, embedding: null }
    export let bordered:boolean = true;
    export let containerClass:string = "";
    export let obtainIris:boolean = false;
    export let autorun:boolean = false;
    export let snapButton:boolean = true;

    import { onMount, createEventDispatcher, tick, onDestroy } from "svelte";
    import { fade } from "svelte/transition";

    import Dialog from "smelte/src/components/Dialog/Dialog.svelte";
    import Select from "smelte/src/components/Select/Select.svelte";
    import Button from "smelte/src/components/Button/Button.svelte";
    import ProgressCircular from "smelte/src/components/ProgressCircular/ProgressCircular.svelte";

    import { ModelLoaded, faceDetector, faceEmbedding, getTensor } from "../services/ai.service"; 
    import type { AnnotatedPrediction } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";

    const md = navigator.mediaDevices;    
    let dispatch = createEventDispatcher();

    let cameraDevices:MediaDeviceInfo[] = [];
    let cameraDeviceSelections = [];
    let selectedCameraDeviceID = localStorage["cameraID"];

    let cameraStream:MediaStream = null;
    let cameraVideo:HTMLVideoElement = null;
    let videoLoaded:boolean = false;

    let irisCanvas:HTMLCanvasElement = null;
    let ctxI:CanvasRenderingContext2D = null;

    let settingsVisible:boolean = false;

    let isSnapping:boolean = false;
    let progressMsg:string = null;

    let previewImageURL = null;

    let isRunning = false;
    let runNext = true;
    let faces:AnnotatedPrediction[] = [];

    let leftAR = 0,
        rightAR = 0;

    function snapProg(state:boolean, msg:string = null) {
        isSnapping = state;
        progressMsg = state ? msg : null;
    }

    async function listCameraDevices() {
        try {
            let devs = await md.enumerateDevices();
            cameraDevices = devs.filter(i => i.kind == "videoinput");
            cameraDeviceSelections = cameraDevices.map((item, index) => { return { value: item.deviceId, text: item.label || item.deviceId || `Camera ${index + 1}`} });
        } catch (error) {
            window.notify("Could not list camera devices! " + error.message);
        }
    }

    async function startCamera() {
        try {
            if (cameraStream) {
                cameraStream.getTracks().forEach(item => item.stop());
            }

            cameraStream = await md.getUserMedia({ video: { deviceId: selectedCameraDeviceID }, audio: false });
            cameraVideo.srcObject = cameraStream;
            cameraVideo.onloadedmetadata = () => {
                videoLoaded = true;
            }
        } catch (error) {
            window.notify("Could not start camera stream! " + error.message);
        }
    }

    async function snapFace() {
        dispatch("beforesnap");

        previewImageURL = null;

        if ($ModelLoaded == false) {
            window.notify("Model is not loaded!");
            return;
        }

        snapProg(true, "Please wait, as first time snap will takes time...");

        try {
            if (!isRunning) {
                faces = await faceDetector.estimateFaces({ input: cameraVideo });
            }

            if (faces.length == 0) {
                window.notify("No face detected! Try again...");
                return;
            }

            let face = faces[0];
            let bb = face.boundingBox;
                let x = bb.topLeft[0],
                    y = bb.topLeft[1],
                    ri = bb.bottomRight[0],
                    bo = bb.bottomRight[1],
                    w = ri - x,
                    h = bo - y;

            let [ l, t, r, b ] = [20, 20, 40, 20];

            let canvas:HTMLCanvasElement = document.createElement("canvas");
            canvas.width = 224;
            canvas.height = 224;

            let ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, 224, 224);
            ctx.drawImage(cameraVideo, x + l, y - t, w - r, h - b, 0, 0, 224, 224);

            let imageURL = canvas.toDataURL("image/jpg", 0.9);
            let imageData = ctx.getImageData(0, 0, 224, 224);
            let inputTensor = getTensor(imageData);
            let embedding = (faceEmbedding.predict(inputTensor)).dataSync();
            embedding = Array.from(embedding);

            capturedFace = {imageURL, embedding};
            previewImageURL = imageURL;

            dispatch("facesnapped");
        } catch (error) {
            window.notify("Error while snapping face! " + error.message);
        }

        dispatch("aftersnap");

        snapProg(false);
    }

    function showCameraSettings() {
        settingsVisible = true;
    }

    async function selectedCameraChanged() {
        localStorage["cameraID"] = selectedCameraDeviceID;
        await startCamera();
    }

    let coords = {
        rightEyeUpper0: [   246, 161, 160, 159, 158, 157, 173],
        rightEyeLower0: [33, 7, 163, 144, 145, 153, 154, 155, 133], // 33, 160, 158, 133, 153, 144
       /*  rightEyeUpper1: [247, 30, 29, 27, 28, 56, 190],
        rightEyeLower1: [130, 25, 110, 24, 23, 22, 26, 112, 243],
        rightEyeUpper2: [113, 225, 224, 223, 222, 221, 189],
        rightEyeLower2: [226, 31, 228, 229, 230, 231, 232, 233, 244],
        rightEyeLower3: [143, 111, 117, 118, 119, 120, 121, 128, 245],

        rightEyebrowUpper: [156, 70, 63, 105, 66, 107, 55, 193],
        rightEyebrowLower: [35, 124, 46, 53, 52, 65], */

        rightEyeIris: [473, 474, 475, 476, 477],

        leftEyeUpper0: [     466, 388, 387, 386, 385, 384, 398],
        leftEyeLower0: [263, 249, 390, 373, 374, 380, 381, 382, 362], // 263, 387, 385, 362, 380, 373
        //leftEyeUpper1: [467, 260, 259, 257, 258, 286, 414],
        //leftEyeLower1: [359, 255, 339, 254, 253, 252, 256, 341, 463],
        //leftEyeUpper2: [342, 445, 444, 443, 442, 441, 413],
        //leftEyeLower2: [446, 261, 448, 449, 450, 451, 452, 453, 464],
        //leftEyeLower3: [372, 340, 346, 347, 348, 349, 350, 357, 465],

        //leftEyebrowUpper: [383, 300, 293, 334, 296, 336, 285, 417],
        //leftEyebrowLower: [265, 353, 276, 283, 282, 295],

        leftEyeIris: [468, 469, 470, 471, 472]
    }

    let color = {
        rightEyeUpper0: "white",
        rightEyeLower0: "blue",
        leftEyeUpper0: "yellow",
        leftEyeLower0: "pink",
        rightEyeIris: "yellow",
        leftEyeIris: "white"
    }

    function _eucl(a, b) {
        let [x1, y1] = a;
        let [x2, y2] = b;
        let v1 = x1 - x2;
        let v2 = y1 - y2;

        return Math.sqrt(v1 * v1 + v2 * v2);
    }

    function getEar(points:number[][]) {
        let [p1, p2, p3, p4, p5, p6] = points;
        let A = _eucl(p2, p6),
            B = _eucl(p3, p5),
            C = _eucl(p1, p4);
        
        return (A + B) / 2 * C;
    }

    function eyesAR(face:AnnotatedPrediction) {
        let m = face.scaledMesh;
        let leftCoords = [263, 387, 385, 362, 380, 373];
        let rightCoords = [33, 160, 158, 133, 153, 144];

        let leftPoints = leftCoords.map(c => {
            let [x, y, _] = m[c];
            return [x, y];
        });
        let rightPoints = rightCoords.map(c => {
            let [x, y, _] = m[c];
            return [x, y];
        });

        let leftAR = getEar(leftPoints);
        let rightAr = getEar(rightPoints);

        return { left: leftAR, right: rightAr }
    }

    function _drawPoints(color:string, g:CanvasRenderingContext2D, indexes:number[], face:AnnotatedPrediction) {
        for (let pos of indexes) {
            let [x, y, z] = face.scaledMesh[pos];
            g.fillStyle = color;
            g.fillRect(x, y, 2, 2);
        }
    }

    function drawIris(face:AnnotatedPrediction) {
        
        let { videoWidth:w, videoHeight:h } = cameraVideo;

        irisCanvas.width = w;
        irisCanvas.height = h;

        if (!ctxI)
            ctxI = irisCanvas.getContext("2d");
        
        let g = ctxI;
        g.clearRect(0, 0, w, h);
        g.fillStyle = "black";
        g.fillRect(0, 0, w, h);
        
        for (let key in coords) {
            let coord = coords[key]
            _drawPoints(color[key], g, coord, face);
        }
    }

    async function _detectFace() {
        try {
            if (videoLoaded && $ModelLoaded)
                faces = await faceDetector.estimateFaces({ input: cameraVideo });

            if (faces.length > 0) {
                let face = faces[0];
                if (obtainIris) {
                    //drawIris(face);

                    let { left, right } = eyesAR(face);
                    leftAR = left;
                    rightAR = right;
                    dispatch("eyeaspectratio", { left, right })
                }
            }
        } catch (error) {                
        }
        if (runNext)
            requestAnimationFrame(_detectFace);
    }

    async function autoRun() {
        if (autorun) {
            isRunning = true;
            runNext = true;
            _detectFace();
            console.log("autorun started!");
        } else {
            isRunning = false;
            runNext = false;
        }
    }

    window.faceCamera = {
        start() {
            console.log("Starting...");

            isRunning = true;
            runNext = true;
            _detectFace();
        },

        snap(onComplete:Function) {
            snapFace().then(() => {
                if (onComplete)
                    onComplete.call(null, capturedFace);
            });
        },

        stop() {
            isRunning = false;
            runNext = false;
        }
    }

    onMount(async () => {
        await tick();
        await startCamera();
        await listCameraDevices();
        autoRun();
    })

    onDestroy(() => {
        runNext = false;
        isRunning = false;
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
    })

</script>

<div class="face-camera {containerClass}" class:bordered>
    <div class="video">
        <video bind:this={cameraVideo} autoplay playsinline/>

        <div class="btns">
            {#if snapButton}
                <Button icon="camera" color="secondary" on:click={snapFace}></Button>
            {/if}
            <Button icon="settings" color="gray" on:click={showCameraSettings}></Button>
        </div>  

        {#if isSnapping}
            <div class="snap-progress" transition:fade|local>
                <div class="circle">
                    <ProgressCircular color="blue" width={3}/>
                </div>
                {#if progressMsg}
                    <label transition:fade|local class="text-center p-4" style="color: #333;">{progressMsg}</label>
                {/if}
            </div>
        {/if}

        {#if previewImageURL}
            <img src={previewImageURL} alt="Preview Image" class="preview">
        {/if}

        <div class="icons">
            <i class="material-icons" class:active={isRunning}>remove_red_eye</i>
        </div>
    </div>
</div>

<Dialog bind:value={settingsVisible}>
    <h6 slot="title">Camera Settings</h6>
    <div class="camera-settings flex flex-col">
        <Select label="Camera Device" items={cameraDeviceSelections} bind:value={selectedCameraDeviceID} on:change={selectedCameraChanged}/>
    </div>
    <div slot="actions">
        <Button text flat small on:click={() => settingsVisible = false}>OK</Button>
    </div>
</Dialog>

<style lang="scss">

    .face-camera {
        display: flex;
        flex-direction: column;
        align-items: center;

        .video {
            background-color: black;
            position: relative;

            video {
                max-height: 400px;
                object-fit: contain;
                object-position: center;
            }

            .btns {
                position: absolute;
                left: 0;
                bottom: 1em;
                width: 100%;
                height: fit-content;
                display: flex;
                justify-content: center;
            }

            .snap-progress {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(255, 255, 255, 0.8);
                display: flex;
                flex-direction: column;
                padding: 1em;
                align-items: center;
                justify-content: center;
                z-index: 20;

                .circle {
                    border-radius: 100%;
                    background-color: #333;
                }
            }

            img.preview {
                position: absolute;
                top: 0.5em;
                right: 0.5em;
                width: 100px;
                height: 100px;
                object-fit: contain;
                object-position: center;
            }

            .icons {
                position: absolute;
                top: 0.5em;
                left: 0.5em;
                width: fit-content;
                display: flex;

                .material-icons {
                    font-size: 2em;
                    color: #888;

                    &.active {
                        color: rgb(118, 188, 245);
                    }

                    &:not(:first-child) {
                        margin-left: 0.5em;
                    }
                }
            }
        }
    }

    :global(.face-camera .video .btns>button:not(:first-child)) {
        margin-left: 0.5em;
    }

    .camera-settings {
        width: 300px;
        max-width: 90vw;
    }

</style>
