import {SharedCodeRunConfiguration} from "../Repositories";

type RunCodeResponse = {
    output: string
    buildOutput: string
    error: string
}

type RetrieveCgenCodeResponse = {
    cgenCode: string
    exitCode: number
    buildOutput: string
    error: string
}

type FormatCodeResponse = {
    output: string
    error: string
}

export type ShareCodeResponse = {
    hash: string
    error: string
}

type CreateBugResponse = {
    link: string
    error: string
}

type VersionResponse = {
    version: string
    error: string
}

export class RunnableCodeSnippet {
    constructor(
        public code: string,
        public buildArguments: string[],
        public runArguments: string[],
        public runConfiguration: SharedCodeRunConfiguration,
    ) {
    }

    public toFormData(): FormData {
        const data = new FormData()
        data.append("code", this.code)
        data.append("build-arguments", this.buildArguments.join(" "))
        data.append("run-arguments", this.runArguments.join(" "))
        data.append("run-configuration", this.runConfiguration.toString())
        return data
    }
}

/**
 * CodeRunner describes how to run, format, and share code.
 */
export class CodeRunner {
    public static async runCode(snippet: RunnableCodeSnippet): Promise<RunCodeResponse> {
        let resp1 = await fetch("/run", {
            method: "post",
            body: snippet.toFormData(),
        });
        if (resp1.status != 200) {
            throw new Error(CodeRunner.buildErrorMessage("run", resp1))
        }
        return await resp1.json() as RunCodeResponse;
    }

    public static async runTest(snippet: RunnableCodeSnippet): Promise<RunCodeResponse> {
        const resp = await fetch("/run_test", {
            method: "post",
            body: snippet.toFormData(),
        });
        if (resp.status != 200) {
            throw new Error(CodeRunner.buildErrorMessage("test", resp));
        }
        return await resp.json() as RunCodeResponse;
    }

    public static async retrieveCgenCode(snippet: RunnableCodeSnippet): Promise<RetrieveCgenCodeResponse> {
        let resp1 = await fetch("/cgen", {
            method: "post",
            body: snippet.toFormData(),
        });
        if (resp1.status != 200) {
            throw new Error(CodeRunner.buildErrorMessage("cgen", resp1))
        }
        return await resp1.json() as RetrieveCgenCodeResponse;
    }

    public static async formatCode(snippet: RunnableCodeSnippet): Promise<FormatCodeResponse> {
        let resp = await fetch("/format", {
            method: "post",
            body: snippet.toFormData(),
        });
        return await resp.json() as FormatCodeResponse;
    }

    public static async shareCode(snippet: RunnableCodeSnippet): Promise<ShareCodeResponse> {
        let resp1 = await fetch("/share", {
            method: "post",
            body: snippet.toFormData(),
        });
        if (resp1.status != 200) {
            throw new Error(CodeRunner.buildErrorMessage("share", resp1))
        }
        return await resp1.json() as ShareCodeResponse;
    }

    public static async createBugUrl(snippet: RunnableCodeSnippet): Promise<CreateBugResponse> {
        let resp1 = await fetch("/create_bug_url", {
            method: "post",
            body: snippet.toFormData(),
        });
        if (resp1.status != 200) {
            throw new Error(CodeRunner.buildErrorMessage("create_bug_url", resp1))
        }
        return await resp1.json() as CreateBugResponse;
    }

    public static async getSpawnVersion(): Promise<VersionResponse> {
        let resp1 = await fetch("/version", {
            method: "post",
        });
        if (resp1.status != 200) {
            throw new Error(CodeRunner.buildErrorMessage("version", resp1))
        }
        return await resp1.json() as VersionResponse;
    }

    private static buildErrorMessage(kind: string, response: Response): string {
        const base = `Failed to invoke \`/${kind}\` endpoint`
        const responseStatus = response.status.toString() + " " + response.statusText
        return `${base}: ${responseStatus}`
    }
}
