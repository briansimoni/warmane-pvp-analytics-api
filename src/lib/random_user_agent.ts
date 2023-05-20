import rand from "random-useragent";

/**
 * returns a random user agent string that hopefully will not be blocked by the
 * primitive bot detection systems on warmane.com
 */
export function randomUserAgent() {
  return rand.getRandom((ua) => {
    if (["Chrome"].includes(ua.browserName) && ua.deviceType === "desktop") {
      return true;
    }
    return false;
  });
}
