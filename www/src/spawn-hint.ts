import {atoms, builtinTypes, keywords, pseudoKeywords} from "./spawn"
import {Editor, Position, Token} from "codemirror"

// @ts-ignore
const Pos = CodeMirror.Pos

/**
 * Describe a completion variant.
 */
interface CompletionVariant {
    /**
     * The text to be matched and inserted.
     */
    text: string,

    /**
     * The text to be displayed in the completion list.
     */
    displayText: string,

    /**
     * The class name to be applied to the completion list item.
     * Used to style the completion list item.
     */
    className: string

    /**
     * Grayed out text that is displayed after the `displayText`.
     */
    detailsText?: string

    /**
     * Description of the completion variant displayed at the end of the completion variant.
     */
    description?: string

    /**
     * Action to be executed when the completion variant is selected.
     */
    onSelect?: (e: Editor) => void
}

/**
 * Describe a completions variants.
 */
interface CompletionVariants {
    from: Position;
    to: Position;
    list: Array<CompletionVariant | string>;
}

function computeCompletionVariants(editor: Editor): CompletionVariants | null {
    // some additional information for the current token.
    let context: Token[] = []
    // find the token at the cursor
    const cur = editor.getCursor()
    let token = editor.getTokenAt(cur)

    const knownImports = new Set<string>()
    for (let i = 0; i < Math.min(editor.lineCount(), 10); i++) {
        const lineTokens = editor.getLineTokens(i).filter(tkn => tkn.type != null)
        if (lineTokens.length > 0 && lineTokens[0].string === "import") {
            knownImports.add(lineTokens[lineTokens.length - 1].string)
        }
    }

    const lineTokens = editor.getLineTokens(cur.line)
    if (lineTokens.length > 0 && lineTokens[0].string === "import") {
        // if the first token is "import", then we are in an import statement,
        // so add this information to context.
        context.push(lineTokens[0])
    }

    const len = token.string.length
    const prevToken = editor.getTokenAt(Pos(cur.line, cur.ch - len))
    if (token.string === ".") {
        context.push(token)
    }
    if (prevToken.string === ".") {
        context.push(prevToken)
    }

    if (/\b(?:string|comment)\b/.test(token.type ?? "")) return null

    // if it's not a 'word-style' token, ignore the token.
    if (!/^[\w$_]*$/.test(token.string)) {
        token = {
            start: cur.ch, end: cur.ch, string: "", state: token.state,
            type: token.string === "." ? "property" : null,
        }
    } else if (token.end > cur.ch) {
        token.end = cur.ch
        token.string = token.string.slice(0, cur.ch - token.start)
    }

    return {
        list: getCompletions(editor, token, knownImports, context),
        from: Pos(cur.line, token.start),
        to: Pos(cur.line, token.end),
    }
}

function getCompletions(editor: Editor, token: Token, knownImports: Set<string>, context: Token[]): CompletionVariant[] {
    const variants: CompletionVariant[] = []
    const tokenValue = token.string

    function addCompletionVariant(variant: CompletionVariant) {
        const variantText = variant.text

        // if no matching text, ignore
        if (!variantText.startsWith(tokenValue)) {
            return
        }

        const alreadyContains = variants.find((f) => f.text === variantText)
        if (!alreadyContains) {
            variants.push(variant)
        }
    }

    if (context && context.length) {
        const lastToken = context.pop()
        if (lastToken !== undefined) {
            // disable completion after dot
            if (lastToken.string === ".") {
                return []
            }
        }
    }

    for (let i = 0; i < editor.lineCount(); i++) {
        const lineTokens = editor.getLineTokens(i)
        lineTokens.forEach((tok, index) => {
            let prev = lineTokens[index - 2] ?? {string: ""}
            if (tok.type === "function" && prev.string === "fn") {
                let name = tok.string
                if (name == 'main') {
                    return
                }

                let endSignatureToken = lineTokens.findIndex((t) => t.string === "{")
                let signatureTokens = lineTokens.slice(index + 1, endSignatureToken ?? lineTokens.length)
                let signature = signatureTokens.map((t) => t.string).join("")

                addCompletionVariant({
                    text: `${name}()`,
                    displayText: name,
                    className: "completion-function",
                    detailsText: signature,
                    onSelect: backward
                })

                signatureTokens.forEach(t => {
                    if (t.type === "variable") {
                        addCompletionVariant({
                            text: t.string,
                            displayText: t.string,
                            className: "completion-parameter",
                        })
                    }
                })
            }

            if (tok.type === "type" && prev.string === "struct") {
                addCompletionVariant({
                    text: `${tok.string}{}`,
                    displayText: tok.string,
                    className: "completion-struct",
                    detailsText: "{}",
                    onSelect: backward
                })
            }

            if (tok.type === "type" && prev.string === "interface") {
                addCompletionVariant({
                    text: tok.string,
                    displayText: tok.string,
                    className: "completion-interface",
                })
            }

            let next = lineTokens[index + 3] ?? {string: ""}
            if (tok.type === "variable" && next.string === "=") {
                addCompletionVariant({
                    text: tok.string,
                    displayText: tok.string,
                    className: "completion-variable",
                })
            }
        })
    }

    knownImports.forEach((text) => {
        addCompletionVariant({
            text: text,
            displayText: text,
            className: "completion-module",
        })
    })

    addCompletionVariant({
        text: "println()",
        displayText: "println",
        detailsText: "(s ...any)",
        className: "completion-function",
        onSelect: backward
    })

    addCompletionVariant({
        text: "print()",
        displayText: "print",
        detailsText: "(s ...any)",
        className: "completion-function",
        onSelect: backward
    })

    addCompletionVariant({
        text: "panic()",
        displayText: "panic",
        detailsText: "(msg string)",
        className: "completion-function",
        onSelect: backward
    })

    addCompletionVariant({
        text: "error()",
        displayText: "error",
        detailsText: "[TData, TError: Error](err TError) -> ![TData, TError]",
        className: "completion-function",
        onSelect: backward
    })

    addCompletionVariant({
        text: "true",
        displayText: "true",
        className: "completion-constant",
    })

    addCompletionVariant({
        text: "false",
        displayText: "false",
        className: "completion-constant",
    })

    addCompletionVariant({
        text: "nil",
        displayText: "nil",
        className: "completion-constant",
    })

    addCompletionVariant({
        text: "none",
        displayText: "none",
        className: "completion-constant",
    })

    addCompletionVariant({
        text: "or {}",
        displayText: "or ",
        detailsText: "{}",
        className: "completion-keyword",
        onSelect: backward
    })

    addCompletionVariant({
        text: "spawn fn () {}()",
        displayText: "spawn ",
        detailsText: "fn () {}()",
        description: "Spawn a new thread",
        className: "completion-keyword",
        onSelect: backwardCount.bind(null, 3)
    })

    addCompletionVariant({
        text: "chan string",
        displayText: "chan ",
        detailsText: " <type>",
        className: "completion-keyword",
        onSelect: (editor) => {
            let cursor = editor.getCursor();
            let startSelection = {
                line: cursor.line,
                ch: cursor.ch - 6
            }
            let endSelection = {
                line: startSelection.line,
                ch: startSelection.ch + 6
            }
            editor.setSelection(endSelection, startSelection)
        }
    })

    addCompletionVariant({
        text: "assert cond, 'assertion failed'",
        displayText: "assert ",
        detailsText: "cond, ['message']",
        className: "completion-keyword",
        onSelect: (editor) => {
            let cursor = editor.getCursor();
            let startSelection = {
                line: cursor.line,
                ch: cursor.ch - 24
            }
            let endSelection = {
                line: startSelection.line,
                ch: startSelection.ch + 4
            }
            editor.setSelection(endSelection, startSelection)
        }
    })

    keywords.forEach((text) => {
        if (text === "spawn" || text === "assert") {
            return
        }

        addCompletionVariant({
            text: text + " ",
            displayText: text,
            className: "completion-keyword",
        })
    })

    pseudoKeywords.forEach((text) => {
        addCompletionVariant({
            text: text + " ",
            displayText: text,
            className: "completion-keyword",
        })
    })

    atoms.forEach((text) => {
        addCompletionVariant({
            text: text,
            displayText: text,
            className: "completion-atom",
        })
    })

    builtinTypes.forEach((text) => {
        addCompletionVariant({
            text: text,
            displayText: text,
            className: "completion-type",
        })
    })

    return variants
}

const backwardCount = (count: number, editor: Editor) => {
    let pos = editor.getCursor()
    pos.ch -= count
    editor.setCursor(pos)
}

const backward = backwardCount.bind(null, 1)

const hintHelper = (editor: Editor) => computeCompletionVariants(editor)

// @ts-ignore
CodeMirror.registerHelper("hint", "spawn", hintHelper)
