import App from './App.svelte';

if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("pwabuilder-sw/pwabuilder-sw.js");
}

declare global {
	interface Window { notify: any, progress: any }
}

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;