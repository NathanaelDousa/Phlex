import * as cp from 'child_process';

/**
 * Roept Ollama aan met een prompt en geeft de AI response terug.
 */
export async function runOllama(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const process = cp.spawn('ollama', ['run', 'llama3']);

        let data = '';
        let errorData = '';

        process.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });

        process.stderr.on('data', (chunk) => {
            errorData += chunk.toString();
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve(data.trim());
            } else {
                reject(new Error(`Ollama process exited with code ${code}: ${errorData}`));
            }
        });

        // Schrijf prompt naar stdin van het proces
        process.stdin.write(prompt);
        process.stdin.end();
    });
}

/**
 * Sanitizes markdown content to escape special characters and avoid rendering issues.
 */
export function sanitizeMarkdown(content: string): string {
    return content
        .replace(/```[\s\S]*?```/g, (match) =>
            match.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
        .replace(/`([^`]+)`/g, '`$1`')
        .replace(/\*\*([^*]+)\*\*/g, '**$1**')
        .replace(/\*([^*]+)\*/g, '*$1*')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}
