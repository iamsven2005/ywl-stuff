// This script should be included in the target iframe page
;(() => {
    window.addEventListener("message", (event) => {
      // Verify the sender of the message
      if (event.origin !== window.location.origin && !event.origin.includes("192.168.1.71")) {
        console.warn("Received message from unexpected origin:", event.origin)
        return
      }
  
      // Handle setCookies message
      if (event.data && event.data.type === "setCookies") {
        console.log("Received setCookies message")
  
        const cookies = event.data.cookies || []
        cookies.forEach((cookie) => {
          try {
            // Format the cookie string
            let cookieStr = `${cookie.name}=${cookie.value}`
  
            if (cookie.domain) {
              cookieStr += `; domain=${cookie.domain}`
            }
  
            if (cookie.path) {
              cookieStr += `; path=${cookie.path}`
            }
  
            // Set the cookie
            document.cookie = cookieStr
            console.log(`Set cookie: ${cookie.name}`)
          } catch (error) {
            console.error(`Failed to set cookie ${cookie.name}:`, error)
          }
        })
  
        console.log("Finished setting cookies")
      }
  
      // Handle single cookie setting (from the example)
      if (event.data && event.data.type === "setCookie") {
        console.log("Setting single cookie:", event.data.value)
        document.cookie = event.data.value
      }
    })
  
    console.log("Cookie handler initialized")
  })()
  
  