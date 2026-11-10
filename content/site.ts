/* Its own module, so client code that needs the URL (analytics, on every page) does not pull in
   the rest of the profile, which only the terminal needs and loads on first open. */
export const SITE_URL = 'https://charbelfayad.com'
