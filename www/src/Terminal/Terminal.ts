import {Filter} from "../Ansi/ansi";

type OnCloseCallback = () => void
type OnWriteCallback = (text: string) => void
type FilterCallback = (text: string) => boolean

export class Terminal {
    private readonly element: HTMLElement
    private onClose: OnCloseCallback | null = null
    private onWrite: OnWriteCallback | null = null
    private filters: FilterCallback[] = []
    private tabsElement: HTMLElement;

    constructor(element: HTMLElement) {
        this.element = element
        this.tabsElement = this.element.querySelector(".js-terminal__tabs") as HTMLElement
        this.tabsElement.querySelector(".js-terminal")
        this.attachResizeHandler(element)
    }

    public registerCloseHandler(handler: () => void) {
        this.onClose = handler
    }

    public registerWriteHandler(handler: (text: string) => void) {
        this.onWrite = handler
    }

    public registerFilter(filter: FilterCallback) {
        this.filters.push(filter)
    }

    public getTabElement(name: string): HTMLElement | null {
        return this.tabsElement.querySelector(`input[value='${name}']`) as HTMLElement
    }

    public openTab(name: string) {
        const tabsInput = this.getTabElement(name)
        if (tabsInput !== null) {
            (tabsInput as HTMLInputElement).checked = true
            tabsInput.dispatchEvent(new Event("change"))
        }
    }

    public openOutputTab() {
        this.openTab("output")
    }

    public openBuildLogTab() {
        this.openTab("build-log")
    }

    public write(text: string) {
        this.writeImpl(text, true)
    }

    public writeOutput(text: string) {
        this.writeImpl(text, false)
    }

    private writeImpl(text: string, buildLog: boolean) {
        const lines = text.split("\n")
        const outputElement = this.getTerminalOutputElement(buildLog)
        const filteredLines = lines.filter(line => this.filters.every(filter => filter(line)))
        const newText = filteredLines.map(this.escapeLine).map(this.highlightLine).join("\n")
        outputElement.innerHTML += newText + "\n"

        if (this.onWrite !== null) {
            this.onWrite(text)
        }
    }

    private escapeLine(line: string): string {
        return line.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }

    private highlightLine(line: string): string {
        let filter = new Filter({});
        return filter.toHtml(line)
    }

    public clear() {
        this.getTerminalOutputElement(false).innerHTML = ""
        this.getTerminalOutputElement(true).innerHTML = ""
    }

    public mount() {
        const closeButton = this.element.querySelector(".js-terminal__close-buttom") as HTMLElement
        if (closeButton === null || closeButton === undefined || this.onClose === null) {
            return
        }

        closeButton.addEventListener("click", this.onClose)

        const tabsElement = this.element.querySelector(".js-terminal__tabs") as HTMLElement
        const tabsInputs = tabsElement.querySelectorAll("input")
        tabsInputs.forEach(input => {
            input.addEventListener("change", () => {
                const value = input.value
                if (value === "output") {
                    this.getTerminalOutputElement(false).style.display = "block"
                    this.getTerminalOutputElement(true).style.display = "none"
                } else {
                    this.getTerminalOutputElement(false).style.display = "none"
                    this.getTerminalOutputElement(true).style.display = "block"
                }
            })
        })
    }

    private getTerminalOutputElement(buildLog: boolean): HTMLElement {
        if (buildLog) {
            return this.element.querySelector(".js-terminal__build-log") as HTMLElement
        }
        return this.element.querySelector(".js-terminal__output") as HTMLElement
    }

    private attachResizeHandler(element: HTMLElement) {
        const header = element.querySelector('.header');
        if (!header) return;

        let mouseDown = false;
        header.addEventListener('mousedown', (e) => {
            const target = e.target as Element;
            if (target.tagName.toLowerCase() === 'label') return;
            mouseDown = true;
            document.body.classList.add('dragging');
        });

        header.addEventListener('touchstart', (e) => {
            const target = e.target as Element;
            if (target.tagName.toLowerCase() === 'label') return;
            mouseDown = true;
            document.body.classList.add('dragging');
        })

        // @ts-ignore
        header.addEventListener('touchmove', (e: TouchEvent) => {
            if (!mouseDown) return;
            element.style.height = `${document.body.clientHeight - e.touches[0].clientY + header.clientHeight / 2}px`;
            e.preventDefault()
        })

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (!mouseDown) return;
            element.style.height = `${document.body.clientHeight - e.clientY + header.clientHeight / 2}px`;
        });

        document.addEventListener('mouseup', () => {
            mouseDown = false;
            document.body.classList.remove('dragging');
        });

        document.addEventListener('touchend', () => {
            mouseDown = false;
            document.body.classList.remove('dragging');
        })
    }
}
