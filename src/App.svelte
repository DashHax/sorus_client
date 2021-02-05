<script lang="ts">
	import "smelte/src/tailwind.css";

	import Router from "svelte-spa-router";
	import { Notifications, notifier } from "smelte";
	import { fade } from "svelte/transition";
	import ProgressCircular from "smelte/src/components/ProgressCircular/ProgressCircular.svelte";

	import { ModelLoaded } from "./services/ai.service";
	import routes from "./routes";

	let progressVisible = false;

	window.notify = function (msg) {
		notifier.notify(msg);
	}

	window.progress = function (state:boolean) {
		progressVisible = !(!state);
	}

	window.progress(true);
	ModelLoaded.subscribe(loaded => {
		if (loaded) {
			window.progress(false);
		}
	})

</script>

<Router {routes} />
<Notifications />

{#if progressVisible}
	<div class="progress-screen" transition:fade|local>
		<div class="circle">
			<ProgressCircular color="blue" width={3}/>
		</div>
	</div>
{/if}

<style lang="scss" global>
	* {
		padding: 0;
		margin: 0;
		box-sizing: border-box;
	}

	body {
		padding: 0;
		margin: 0;
	}

	.progress-screen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;

		background-color: rgba(0, 0, 0, 0.4);
		z-index: 99999999999;

		.circle {
			padding: 1em;
			border-radius: 100%;
			background-color: rgba(0, 0, 0, 0.9);
		}
	}
</style>