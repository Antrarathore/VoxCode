const API_BASE_URL = 'http://localhost:8000';
const EDITOR_PLACEHOLDER = '# Generated code will appear here...';

let recognition = null;
let isListening = false;
let pendingRunAfterGenerate = false;
let pendingExplainAfterGenerate = false;
let pendingRefineAfterGenerate = false;

const elements = {
    languageSelect: document.getElementById('languageSelect'),
    instructionInput: document.getElementById('instructionInput'),
    refineInput: document.getElementById('refineInput'),
    codeEditor: document.getElementById('codeEditor'),
    lineNumbers: document.getElementById('lineNumbers'),
    outputConsole: document.getElementById('outputConsole'),
    errorConsole: document.getElementById('errorConsole'),
    explanationPanel: document.getElementById('explanationPanel'),
    statusText: document.getElementById('statusText'),
    compilerStatus: document.getElementById('compilerStatus'),
    backendHealth: document.getElementById('backendHealth'),
    selectedLanguage: document.getElementById('selectedLanguage'),
    voiceSupport: document.getElementById('voiceSupport'),
    executionMode: document.getElementById('executionMode'),
    executionTime: document.getElementById('executionTime'),
    helperMessage: document.getElementById('helperMessage'),
    voiceButton: document.getElementById('voiceButton'),
    generateButton: document.getElementById('generateButton'),
    refineButton: document.getElementById('refineButton'),
    explainButton: document.getElementById('explainButton'),
    runButton: document.getElementById('runButton'),
    copyButton: document.getElementById('copyButton'),
    clearButton: document.getElementById('clearButton')
};

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    setupSpeechRecognition();
    syncLanguageDetails();
    updateLineNumbers();
    checkBackendHealth();
});

function bindEvents() {
    elements.languageSelect.addEventListener('change', syncLanguageDetails);
    elements.voiceButton.addEventListener('click', toggleVoiceInput);
    elements.generateButton.addEventListener('click', () => generateCode({ source: 'button' }));
    elements.refineButton.addEventListener('click', refineCode);
    elements.explainButton.addEventListener('click', explainCode);
    elements.runButton.addEventListener('click', runCode);
    elements.copyButton.addEventListener('click', copyCode);
    elements.clearButton.addEventListener('click', clearAll);
    elements.codeEditor.addEventListener('input', handleEditorInput);
    elements.codeEditor.addEventListener('scroll', syncLineNumberScroll);
    elements.codeEditor.addEventListener('keydown', handleEditorKeydown);
}

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        elements.voiceSupport.textContent = 'Not supported';
        elements.helperMessage.textContent = 'This browser does not support Web Speech API. Use Chrome or Edge for voice input.';
        elements.voiceButton.disabled = true;
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
        isListening = true;
        elements.voiceButton.textContent = 'Listening...';
        setStatus('Listening...', 'Speech recognizer is capturing programming instruction.', 'progress');
        elements.helperMessage.textContent = 'Listening. Say the program you want to build.';
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join(' ')
            .trim();

        elements.instructionInput.value = transcript;
        elements.helperMessage.textContent = `Captured instruction: "${transcript}"`;
    };

    recognition.onerror = (event) => {
        const message = `Voice input failed: ${event.error}`;
        setStatus('Voice input error', message, 'error');
        writeError(message);
    };

    recognition.onend = async () => {
        isListening = false;
        elements.voiceButton.textContent = 'Speak';

        const instruction = elements.instructionInput.value.trim();
        if (!instruction) {
            setStatus('Ready', 'Awaiting instruction', 'ready');
            return;
        }

        setStatus('Voice captured', 'Instruction received. Generating code automatically...', 'progress');
        await generateCode({ source: 'voice' });
    };

    elements.voiceSupport.textContent = 'Web Speech API ready';
}

function toggleVoiceInput() {
    if (!recognition) {
        return;
    }

    if (isListening) {
        recognition.stop();
        return;
    }

    recognition.start();
}

function syncLanguageDetails() {
    const language = elements.languageSelect.value;
    elements.selectedLanguage.textContent = language;

    if (language === 'Python') {
        elements.executionMode.textContent = 'Python runtime enabled';
        elements.compilerStatus.textContent = 'Python execution available';
    } else {
        elements.executionMode.textContent = `${language} generation enabled`;
        elements.compilerStatus.textContent = `${language} execution support coming soon`;
    }
}

function handleEditorInput() {
    updateLineNumbers();

    if (isEditorEmpty()) {
        return;
    }

    elements.compilerStatus.textContent = 'Editor updated - current source ready to run';
    elements.helperMessage.textContent = 'Manual edits detected in Source Code Editor. Run / Compile Code will execute this exact code.';
}

function handleEditorKeydown(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        runCode();
    }
}

async function generateCode(options = {}) {
    const instruction = elements.instructionInput.value.trim();
    if (!instruction) {
        setStatus('Input required', 'Please enter or speak a programming instruction first.', 'warning');
        writeError('No instruction provided. Add a voice or text instruction and try again.');
        return false;
    }

    const source = options.source || 'button';
    const loadingText = source === 'voice' ? 'Generating code from voice input...' : 'Generating code...';

    const success = await callApi({
        endpoint: '/generate',
        body: { text: instruction, language: elements.languageSelect.value },
        loadingText,
        onSuccess: async (data) => {
            elements.codeEditor.value = data.code;
            updateLineNumbers();
            elements.helperMessage.textContent = 'Code is ready in the editor. Review it, tweak it, then run.';
            writeOutput('Code is ready. Run it to see the program output.');
            writeError('No compiler issues detected during generation.');
            setStatus('Code generated', 'AI code generation completed successfully.', 'success');

            if (pendingRefineAfterGenerate) {
                pendingRefineAfterGenerate = false;
                await refineCode();
            }
            if (pendingExplainAfterGenerate) {
                pendingExplainAfterGenerate = false;
                await explainCode();
            }
            if (pendingRunAfterGenerate) {
                pendingRunAfterGenerate = false;
                await runCode();
            }
        }
    });

    return success;
}

async function refineCode() {
    const instruction = elements.refineInput.value.trim();
    if (!instruction) {
        setStatus('Refinement required', 'Enter a refinement instruction such as add comments or optimize it.', 'warning');
        writeError('No refinement instruction provided.');
        return;
    }

    if (isEditorEmpty()) {
        if (!elements.instructionInput.value.trim()) {
            setStatus('Code required', 'Provide an instruction first so code can be generated before refinement.', 'warning');
            writeError('Refinement skipped because no source code or base instruction is available.');
            return;
        }

        pendingRefineAfterGenerate = true;
        setStatus('Preparing refinement', 'Generating the first version, then applying your refinement.', 'progress');
        await generateCode({ source: 'auto-refine' });
        return;
    }

    const previousCode = elements.codeEditor.value.trim();
    await callApi({
        endpoint: '/refine',
        body: { previous_code: previousCode, instruction, language: elements.languageSelect.value },
        loadingText: 'Refining code...',
        onSuccess: (data) => {
            elements.codeEditor.value = data.code;
            updateLineNumbers();
            elements.refineInput.value = '';
            elements.helperMessage.textContent = 'Refined code is now in Source Code Editor. Any further manual edits will be run exactly as written.';
            writeOutput('Refined code has replaced the existing source in the editor.');
            writeError('No compiler issues detected during refinement.');
            setStatus('Code refined', 'Refined source code returned from the AI engine.', 'success');
        }
    });
}

async function explainCode() {
    if (isEditorEmpty()) {
        if (!elements.instructionInput.value.trim()) {
            setStatus('Code required', 'Provide an instruction first so code can be generated before explanation.', 'warning');
            writeError('Explanation skipped because no source code or base instruction is available.');
            return;
        }

        pendingExplainAfterGenerate = true;
        setStatus('Preparing explanation', 'Generating the code first, then explaining it.', 'progress');
        await generateCode({ source: 'auto-explain' });
        return;
    }

    const code = elements.codeEditor.value.trim();
    await callApi({
        endpoint: '/explain',
        body: { code, language: elements.languageSelect.value },
        loadingText: 'Explaining code...',
        onSuccess: (data) => {
            elements.explanationPanel.textContent = data.explanation;
            setStatus('Explanation ready', 'AI explanation generated for the current source code.', 'success');
        }
    });
}

async function runCode() {
    if (isEditorEmpty()) {
        if (!elements.instructionInput.value.trim()) {
            setStatus('Code required', 'Please enter or speak an instruction first.', 'warning');
            writeError('Run request skipped because the editor is empty and there is no source instruction to generate from.');
            return;
        }

        pendingRunAfterGenerate = true;
        setStatus('Preparing execution', 'Generating code first, then running it.', 'progress');
        await generateCode({ source: 'auto-run' });
        return;
    }

    const code = elements.codeEditor.value.trim();
    elements.helperMessage.textContent = 'Running the code currently visible in the editor.';
    await callApi({
        endpoint: '/run',
        body: { code, language: elements.languageSelect.value },
        loadingText: 'Running code from Source Code Editor...',
        onSuccess: (data) => {
            elements.executionTime.textContent = `${Number(data.execution_time || 0).toFixed(3)}s`;
            elements.compilerStatus.textContent = data.compiler_message;
            elements.helperMessage.textContent = 'Run complete. Check Program Output and Compiler Messages.';
            writeOutput(data.output || 'No runtime output.');
            writeError(data.error || data.compiler_message || 'No compiler errors.');

            if (data.status === 'success') {
                setStatus('Execution Successful', data.compiler_message, 'success');
            } else if (data.status === 'warning') {
                setStatus('Execution Warning', data.compiler_message, 'warning');
            } else {
                setStatus('Compilation Failed', data.compiler_message, 'error');
            }
        }
    });
}

async function copyCode() {
    const code = elements.codeEditor.value;
    if (isEditorEmpty()) {
        setStatus('Nothing to copy', 'The source code editor is empty.', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(code);
        setStatus('Copied', 'Source code copied to clipboard.', 'success');
    } catch (error) {
        setStatus('Copy failed', 'Clipboard access failed in this browser.', 'error');
        writeError(`Copy failed: ${error.message}`);
    }
}

function clearAll() {
    pendingRunAfterGenerate = false;
    pendingExplainAfterGenerate = false;
    pendingRefineAfterGenerate = false;
    elements.instructionInput.value = '';
    elements.refineInput.value = '';
    elements.codeEditor.value = EDITOR_PLACEHOLDER;
    updateLineNumbers();
    elements.outputConsole.textContent = 'Execution results from the current Source Code Editor will appear here...';
    elements.errorConsole.textContent = 'Compiler diagnostics, syntax issues, runtime errors, and warnings will appear here...';
    elements.explanationPanel.textContent = 'Ask the AI to explain the generated code in beginner-friendly language.';
    elements.executionTime.textContent = '0.000s';
    elements.helperMessage.textContent = 'Speak a small programming task, or type it here before your viva. VoxCode will put the result in the editor first.';
    setStatus('Ready', 'Workspace cleared and ready for the next instruction.', 'ready');
    syncLanguageDetails();
}

async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        elements.backendHealth.textContent = data.ollama_available ? 'Backend + Ollama ready' : 'Backend ready, Ollama offline';

        if (!data.ollama_available) {
            writeError('Backend is running, but Ollama is not reachable. Start Ollama and run: ollama pull deepseek-coder');
            setStatus('Backend ready', 'Ollama is currently unavailable.', 'warning');
        }
    } catch (error) {
        elements.backendHealth.textContent = 'Backend unavailable';
        writeError('Cannot connect to FastAPI backend at http://localhost:8000. Start the backend before using the compiler.');
        setStatus('Backend offline', 'FastAPI server is not reachable.', 'error');
    }
}

async function callApi({ endpoint, body, loadingText, onSuccess }) {
    setLoadingState(true, loadingText);
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.detail || `Request failed with status ${response.status}`);
        }

        await onSuccess(data);
        return true;
    } catch (error) {
        setStatus('Operation failed', error.message, 'error');
        writeError(error.message);
        return false;
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(isLoading, message = 'Working...') {
    const buttons = [elements.voiceButton, elements.generateButton, elements.refineButton, elements.explainButton, elements.runButton, elements.copyButton, elements.clearButton];
    buttons.forEach((button) => {
        button.disabled = isLoading;
        button.classList.toggle('is-loading', isLoading);
    });

    if (isLoading) {
        setStatus(message, message, 'progress');
    }
}

function setStatus(title, compilerMessage, mode) {
    elements.statusText.textContent = title;
    elements.compilerStatus.textContent = compilerMessage;
    elements.statusText.className = `status-${mode}`;
}

function updateLineNumbers() {
    const lineCount = Math.max(elements.codeEditor.value.split('\n').length, 1);
    elements.lineNumbers.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join('\n');
    syncLineNumberScroll();
}

function syncLineNumberScroll() {
    elements.lineNumbers.scrollTop = elements.codeEditor.scrollTop;
}

function isEditorEmpty() {
    const value = elements.codeEditor.value.trim();
    return !value || value === EDITOR_PLACEHOLDER;
}

function writeOutput(message) {
    elements.outputConsole.textContent = message;
}

function writeError(message) {
    elements.errorConsole.textContent = message;
}
