// Throw this from a route to send a specific status and message to the browser.
export class HttpError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}
