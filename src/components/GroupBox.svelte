<script lang="ts">
    export let label:string = null;
    export let classes:string = null;
</script>

<div {...$$props} class="groupbox {classes}">
    {#if label}    
        <label class="label text-sm" style="color: #888">{label}</label>
    {/if}
    <slot></slot>
</div>

<style lang="scss">
    .groupbox {
        position: relative;
        margin: 1em 0.5em 0.5em 0.5em;
        padding: 0.5em;
        padding-top: 1em;

        border: 1px solid #ccc;
        border-radius: 0.25em;

        label.label {
            position: absolute;
            transform: translate(0.5em, -125%);
            background-color: white;
            padding: 0 0.5em;
            border-radius: 4px;
        }
    }
</style>