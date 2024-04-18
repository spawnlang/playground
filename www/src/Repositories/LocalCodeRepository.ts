import {CodeRepository, CodeSnippet} from "./interface";

/**
 * Local code repository using the browser's local storage.
 */
export class LocalCodeRepository implements CodeRepository {
    private static readonly LOCAL_STORAGE_KEY = "code"

    // language=V
    public static readonly WELCOME_CODE = `
// Welcome to the Spawn Playground!
// Here you can edit, run, and share Spawn code.
// Let's start with a simple "Hello, Playground!" example:
fn main() {
    println('Hello, Playground!')
}

// To run the code, click the "Run" button or just press Ctrl + R.
// To format the code, click the "Format" button or just press Ctrl + L.

// More examples are available in top dropdown list.
// You can find Help for shortcuts in the bottom right corner or just press Ctrl + I.
// See also change theme button in the top right corner.
// If you want to learn more about Spawn, visit https://docs.spawnlang.dev/.
// Join us on Discord: https://discord.gg/dW4ytWQyEY
// Enjoy!
`.trimStart()

    saveCode(code: string) {
        window.localStorage.setItem(LocalCodeRepository.LOCAL_STORAGE_KEY, code)
    }

    getCode(onReady: (snippet: CodeSnippet) => void) {
        const localCode = window.localStorage.getItem(LocalCodeRepository.LOCAL_STORAGE_KEY)
        if (localCode === null || localCode === undefined) {
            onReady({code: LocalCodeRepository.WELCOME_CODE})
            return
        }
        onReady({code: localCode})
    }
}
