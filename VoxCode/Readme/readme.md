# VoxCode AI - Voice to Code Converter

A modern, AI-powered web application that converts voice instructions into functional code. Built as a college project with clean, modular architecture and impressive UI/UX.

## 🎯 Features

- **Voice-to-Code**: Speak coding instructions and generate code instantly
- **Multi-Language Support**: Generate code in Python, C++, and Java
- **AI-Powered**: Uses Deepseek-Coder model via Ollama for intelligent code generation
- **Code Refinement**: Iteratively improve code with natural language instructions
- **Code Explanation**: Get beginner-friendly explanations of generated code
- **Modern UI**: Professional dark theme with gradient effects and smooth animations
- **Real-time Processing**: Fast response times with local AI model integration

## 🏗️ Project Structure

```
VoxCodeAI/
├── backend/
│   ├── main.py           # FastAPI server with endpoints
│   ├── prompts.py        # Prompt engineering templates
│   └── ai_engine.py      # Ollama integration
├── frontend/
│   ├── index.html        # Complete UI structure
│   ├── style.css         # Modern dark theme styling
│   └── script.js         # Speech recognition and API calls
└── README.md            # This file
```

## 🚀 Installation & Setup

### Prerequisites

1. **Python 3.8+** installed on your system
2. **Ollama** installed and running
3. **Chrome or Edge** browser (for speech recognition support)

### Step 1: Install Ollama

1. Download and install Ollama from [https://ollama.ai](https://ollama.ai)
2. Install Ollama on your system:
   ```bash
   # For Windows (using PowerShell)
   iwr -useb https://ollama.ai/install.ps1 | iex
   
   # For macOS
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # For Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

### Step 2: Pull Deepseek-Coder Model

```bash
ollama pull deepseek-coder
```

### Step 3: Start Ollama Service

```bash
ollama serve
```

**Important**: Keep this terminal window open. Ollama must be running for the application to work.

### Step 4: Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install required Python packages:
   ```bash
   pip install fastapi uvicorn requests
   ```

3. Start the FastAPI server:
   ```bash
   python main.py
   ```

The backend will start running on `http://localhost:8000`

### Step 5: Run Frontend

1. Open a new terminal window
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Open the `index.html` file in your browser:
   ```bash
   # Option 1: Using Python's built-in server
   python -m http.server 3000
   
   # Option 2: Simply open the file in Chrome/Edge
   start index.html  # Windows
   open index.html   # macOS
   ```

4. Open your browser and go to `http://localhost:3000` (if using Python server) or the file URL

## 🎮 How to Use

1. **Start Speaking**: Click the microphone button and clearly state your coding instruction
   - Example: "create a Python function to add two numbers"
   - Example: "write a C++ program to find factorial of a number"

2. **Generate Code**: Click "Generate Code" or press Ctrl+Enter in the instruction area

3. **Copy & Use**: Copy the generated code to your clipboard

4. **Refine Code**: Enter refinement instructions like:
   - "add comments"
   - "optimize this"
   - "make it recursive"
   - "add error handling"

5. **Explain Code**: Click "Explain This Code" to get beginner-friendly explanations

## 🔧 API Endpoints

### Generate Code
```
POST /generate
Content-Type: application/json

{
  "text": "create a Python function to add two numbers",
  "language": "Python"
}
```

### Refine Code
```
POST /refine
Content-Type: application/json

{
  "previous_code": "def add(a, b): return a + b",
  "instruction": "add comments",
  "language": "Python"
}
```

### Explain Code
```
POST /explain
Content-Type: application/json

{
  "code": "def add(a, b): return a + b",
  "language": "Python"
}
```

## 🎨 Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **JavaScript** - Speech recognition and API interactions
- **Web Speech API** - Voice recognition capabilities

### Backend
- **Python 3.8+** - Core programming language
- **FastAPI** - Modern web framework for APIs
- **Uvicorn** - ASGI server
- **Requests** - HTTP client for Ollama API

### AI/ML
- **Ollama** - Local AI model serving
- **Deepseek-Coder** - Code generation model
- **Prompt Engineering** - Optimized prompts for different tasks

## 🌟 Key Features for College Project

### AI Innovation Features
1. **Context-Aware Code Refinement**: Modify existing code based on natural language
2. **Smart Prompting**: Optimized prompts for clean, efficient code generation
3. **Code Explanation Mode**: Beginner-friendly explanations for learning

### Team Roles Showcase
- **Member 1 – AI & Backend**: FastAPI, AI integration, prompt engineering
- **Member 2 – Frontend & UI**: Website design, speech recognition, interactions
- **Member 3 – Integration & Testing**: API integration, error handling, testing

### Visual Appeal
- Dark gradient theme with purple/blue accents
- Smooth animations and hover effects
- Professional card-based layout
- Responsive design for all devices

## 🔍 Troubleshooting

### Common Issues

1. **Speech Recognition Not Working**
   - Use Chrome or Edge browser
   - Allow microphone permissions when prompted
   - Check if microphone is working

2. **Backend Connection Error**
   - Ensure backend server is running on port 8000
   - Check if Ollama is running (`ollama serve`)
   - Verify deepseek-coder model is installed

3. **Code Generation Fails**
   - Check Ollama service status
   - Verify deepseek-coder model is pulled
   - Check backend logs for errors

4. **Ollama Connection Issues**
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   
   # Restart Ollama if needed
   ollama serve
   ```

## 🚀 Future Improvements

1. **More Programming Languages**: Add JavaScript, Go, Rust support
2. **Code Execution**: Run and test generated code in the browser
3. **Project Templates**: Generate complete project structures
4. **Voice Settings**: Customizable voice recognition settings
5. **Code History**: Save and manage generated code snippets
6. **Collaboration Features**: Share code with team members
7. **Advanced Refinements**: More sophisticated code modification options
8. **Mobile App**: Native mobile application for iOS and Android

## 📝 Project Notes

### For Viva Presentation
- **Architecture**: Clean separation of frontend, backend, and AI components
- **Innovation**: Voice-to-code with context-aware refinement
- **Technology Stack**: Modern web technologies with local AI processing
- **User Experience**: Intuitive interface with professional design
- **Scalability**: Modular design allows easy feature additions

### Learning Outcomes
- Full-stack web development
- AI model integration
- Speech recognition implementation
- API design and development
- Modern UI/UX design principles
- Prompt engineering techniques

## 📞 Support

For any issues or questions during the project demonstration:

1. Check the troubleshooting section above
2. Verify all components are running (Ollama, Backend, Frontend)
3. Check browser console for JavaScript errors
4. Check backend terminal for API errors

---

**VoxCode AI** - Transforming voice into code, one line at a time. 🎙️➡️💻
