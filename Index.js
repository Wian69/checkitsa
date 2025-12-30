addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const data = await request.json() // receive JSON from frontend
    return new Response(JSON.stringify({
      success: true,
      message: "Backend received your request",
      data: data
    }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      headers: { "Content-Type": "application/json" }
    })
  }
}
