import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Key, Code, Terminal, Copy } from 'lucide-react';

export function AISetupInstructions() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-deep-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AI Features Setup
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Configure OpenAI API to unlock AI-powered movie recommendations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Step 1: Get API Key */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-blue-400" />
                <span>Step 1: Get OpenAI API Key</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenAI API Keys</a></li>
                <li>Sign in or create an account</li>
                <li>Click "Create new secret key"</li>
                <li>Copy the generated API key</li>
              </ol>
              <Button
                onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Key className="w-4 h-4 mr-2" />
                Get API Key
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Create .env file */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-green-400" />
                <span>Step 2: Create Environment File</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-300">
                Create a <code className="bg-gray-800 px-2 py-1 rounded">.env</code> file in the <code className="bg-gray-800 px-2 py-1 rounded">client/</code> directory:
              </p>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">client/.env</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('VITE_OPENAI_API_KEY=your_api_key_here')}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <code className="text-sm text-green-400">
                  VITE_OPENAI_API_KEY=your_api_key_here
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Restart Development Server */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-yellow-400" />
                <span>Step 3: Restart Development Server</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-300">
                Stop your development server and restart it to load the new environment variables:
              </p>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Terminal Commands</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('npm run dev')}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <code className="text-sm text-yellow-400">
                  npm run dev
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>AI Features You'll Unlock</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">🤖</Badge>
                  <span className="text-sm">AI Chat Assistant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">💭</Badge>
                  <span className="text-sm">Mood-Based Recommendations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">🧠</Badge>
                  <span className="text-sm">Personalized Movie Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">⭐</Badge>
                  <span className="text-sm">Movie Trivia Generator</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">🎯</Badge>
                  <span className="text-sm">Smart Watchlist Suggestions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Note */}
        <Card className="mt-8 bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">🔒 Security Note</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• The <code className="bg-gray-800 px-1 rounded">.env</code> file is automatically ignored by Git</li>
              <li>• Never commit your API key to version control</li>
              <li>• Keep your API key secure and don't share it publicly</li>
              <li>• Monitor your OpenAI usage to avoid unexpected charges</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 