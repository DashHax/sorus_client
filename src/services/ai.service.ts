import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import { writable } from "svelte/store";
import type { LayersModel } from "@tensorflow/tfjs";
import type { MediaPipeFaceMesh } from "@tensorflow-models/face-landmarks-detection/dist/types";

const ModelLoaded = writable(false);
let faceDetector:MediaPipeFaceMesh;
let faceEmbedding:LayersModel;

async function loadModels() {
    faceDetector = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh, {
        detectionConfidence: 0.94,
        maxFaces: 1,
    });

    faceEmbedding = await tf.loadLayersModel("models/face_recognition/model.json");
    ModelLoaded.set(true);
}

function getTensor(imageData:ImageData) {
    let tensor = tf.browser.fromPixels(imageData, 3);
    tensor = tensor.div(255).expandDims(0);
    return tensor;
}

loadModels().then(() => { console.log("Loaded AI models!") }).catch(err => window.notify("Error while loading model! " + err.message));

export {
    ModelLoaded, loadModels, getTensor, faceDetector, faceEmbedding
}