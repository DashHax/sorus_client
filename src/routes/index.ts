import Auth from "./auth/Auth.svelte";
import Dashboard from "./dashboard/Dashboard.svelte";
import CheckIn from "./checkin/CheckIn.svelte";
import Records from "./dashboard/Records.svelte";
import Logout from "./Logout.svelte";

export default {
    '/': Auth,
    '/dashboard': Dashboard,
    '/checkin': CheckIn,
    '/records': Records,
    '/logout': Logout
}