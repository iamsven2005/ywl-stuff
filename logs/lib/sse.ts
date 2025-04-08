export function createSSEStream() {
    let controller: ReadableStreamDefaultController
  
    const readable = new ReadableStream({
      start(c) {
        controller = c
      },
    })
  
    const push = (data: string) => {
      controller.enqueue(`data: ${data}\n\n`)
    }
  
    return { readable, push }
  }
  