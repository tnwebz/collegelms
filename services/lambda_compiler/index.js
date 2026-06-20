const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TMP_DIR = os.tmpdir();

exports.handler = async (event, context) => {
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
        
        let code = body.source_code || body.code || '';
        const testCases = body.test_cases || [];
        const stdinInput = body.stdin || '';
        
        let languageId = body.language_id;
        if (languageId == null) {
            const lang = (body.language || 'node').toLowerCase();
            if (lang === 'python') languageId = 71;
            else if (['cpp', 'c++'].includes(lang)) languageId = 54;
            else if (lang === 'java') languageId = 62;
            else if (lang === 'javascript' || lang === 'node') languageId = 63;
            else return responseError('Unsupported language');
        }

        if (!code.trim()) {
            return responseError('No source code provided');
        }

        let results = [];
        let passedCount = 0;

        if (languageId === 63 || languageId === 71) {
            // Node.js or Python interpreted
            let scriptPath = path.join(TMP_DIR, languageId === 63 ? 'script.js' : 'script.py');
            
            if (languageId === 63) {
                // NodeJS testing wrapper
                const driverCode = `
const testCases = ${JSON.stringify(testCases)};
${code}

async function main() {
    if (!testCases.length) {
        try {
            if (typeof solve === 'function') {
                const res = await solve();
                console.log(JSON.stringify({ output: res }));
            } else {
                console.log(JSON.stringify({ error: "Function solve() not found" }));
            }
        } catch(e) {
            console.log(JSON.stringify({ error: e.toString() }));
        }
        return;
    }

    const results = [];
    let passed = 0;

    for (let i = 0; i < testCases.length; i++) {
        try {
            const c = testCases[i];
            let inp = c.input;
            const expected = String(c.output).trim();
            
            if (typeof inp === 'string' && !isNaN(inp)) {
                inp = inp.includes('.') ? parseFloat(inp) : parseInt(inp);
            }

            const actual = String(await solve(inp)).trim();
            const status = actual === expected ? "Passed" : "Failed";
            if (status === "Passed") passed++;

            results.push({ id: i, input: String(inp), expected, actual, status });
        } catch (e) {
            results.push({ id: i, status: "Runtime Error", error: e.toString() });
        }
    }

    console.log(JSON.stringify({
        stats: { passed, total: testCases.length },
        results
    }));
}
main();
`;
                fs.writeFileSync(scriptPath, driverCode);
                return await runAndCapture(['node', scriptPath], stdinInput);
            } else {
                // Python wrapper from original logic
                const pyDriver = `
import json
${code}
def main():
    cases = ${JSON.stringify(testCases)}
    solve_fn = globals().get("solve")
    if not callable(solve_fn):
        print(json.dumps({"error": "Function solve() not found"}))
        return
    if not cases:
        try: solve_fn(None)
        except Exception as e: print(json.dumps({"error": str(e)}))
        return
    results = []
    passed = 0
    for i, c in enumerate(cases):
        try:
            inp = c.get("input")
            expected = str(c.get("output", "")).strip()
            arg = inp
            if isinstance(inp, str):
                if inp.isdigit(): arg = int(inp)
                elif inp.replace(".", "", 1).isdigit(): arg = float(inp)
            actual = str(solve_fn(arg)).strip()
            status = "Passed" if actual == expected else "Failed"
            if status == "Passed": passed += 1
            results.append({"id": i, "input": str(inp), "expected": expected, "actual": actual, "status": status})
        except Exception as e:
            results.append({"id": i, "status": "Runtime Error", "error": str(e)})
    print(json.dumps({"stats": {"passed": passed, "total": len(cases)}, "results": results}))
if __name__ == "__main__": main()
`;
                fs.writeFileSync(scriptPath, pyDriver);
                return await runAndCapture(['python3', scriptPath], stdinInput);
            }
        }

        let runCmd = [];
        if (languageId === 54) {
            // C++
            const srcPath = path.join(TMP_DIR, 'main.cpp');
            const exePath = path.join(TMP_DIR, 'main');
            fs.writeFileSync(srcPath, code);
            
            await executeCommand(`g++ ${srcPath} -O2 -o ${exePath}`);
            runCmd = [exePath];
        } else if (languageId === 62) {
            // Java
            const srcPath = path.join(TMP_DIR, 'Main.java');
            fs.writeFileSync(srcPath, code);
            
            await executeCommand(`javac ${srcPath}`);
            runCmd = ['java', '-cp', TMP_DIR, 'Main'];
        }

        if (!testCases.length) {
            return await runAndCapture(runCmd, stdinInput);
        }

        for (let i = 0; i < testCases.length; i++) {
            const caseData = testCases[i];
            const inpStr = String(caseData.input || '');
            const expected = String(caseData.output || '').trim();

            try {
                const out = await executeCommandWithInput(runCmd, inpStr);
                const actual = out.stdout.trim();
                const status = actual === expected ? 'Passed' : 'Failed';
                if (status === 'Passed') passedCount++;
                results.push({ id: i, input: inpStr, expected, actual, status });
            } catch (e) {
                if (e.timeout) {
                    results.push({ id: i, status: 'Time Limit Exceeded', error: 'Timeout' });
                } else {
                    results.push({ id: i, status: 'Runtime Error', error: e.stderr || e.message });
                }
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                stats: { passed: passedCount, total: testCases.length },
                results
            })
        };

    } catch (e) {
        return responseError('Execution Error: ' + e.message);
    }
};

function responseError(msg) {
    return { statusCode: 200, body: JSON.stringify({ error: msg }) };
}

function executeCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) reject({ err, stderr });
            else resolve(stdout);
        });
    });
}

function executeCommandWithInput(cmdArgs, input) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmdArgs[0], cmdArgs.slice(1));
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', data => stdout += data.toString());
        proc.stderr.on('data', data => stderr += data.toString());

        let isDone = false;
        const timeout = setTimeout(() => {
            isDone = true;
            proc.kill();
            reject({ timeout: true });
        }, 2000);

        proc.on('close', code => {
            if (isDone) return;
            clearTimeout(timeout);
            if (code !== 0) reject({ code, stderr });
            else resolve({ stdout });
        });

        if (input) proc.stdin.write(input);
        proc.stdin.end();
    });
}

async function runAndCapture(cmdArgs, input) {
    try {
        const out = await executeCommandWithInput(cmdArgs, input);
        const outputStr = out.stdout + '';
        try {
            return { statusCode: 200, body: outputStr.trim().startsWith('{') ? outputStr : JSON.stringify({ output: outputStr }) };
        } catch {
            return { statusCode: 200, body: JSON.stringify({ output: outputStr }) };
        }
    } catch (e) {
        if (e.timeout) return responseError('Time Limit Exceeded');
        return responseError('Execution Error: ' + (e.stderr || e.message || 'Crash'));
    }
}
