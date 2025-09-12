"use client"
import Image from "next/image";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import "./globals.css"
import TextareaAutosize from 'react-textarea-autosize';
import { useState, useRef } from 'react'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Register the plugin
gsap.registerPlugin(useGSAP);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function Button({ text }) {
  return (
    <div className="bg-[#0A0A0A] w-full h-full rounded-sm cursor-pointer">
      <p className="text-background font-merri text-xs font-bold p-2">
        {text}
      </p>
    </div>
  )
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  
  // Refs for GSAP animations
  const containerRef = useRef(null);
  const landingSceneRef = useRef(null);
  const chatSceneRef = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Timeline ref for scene transitions
  const tl = useRef<gsap.core.Timeline>();

  // GSAP animation setup
  const { contextSafe } = useGSAP(() => {
    // Create main timeline for scene transitions
    tl.current = gsap.timeline({ paused: true });

    // Set initial states
    gsap.set(chatSceneRef.current, {
      opacity: 0,
      y: 50,
      display: 'none'
    });

    // Define the transition timeline
    tl.current
      .to(landingSceneRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.6,
        ease: "power2.inOut"
      })
      .set(chatSceneRef.current, {
        display: 'flex'
      })
      .fromTo(chatSceneRef.current, 
        {
          opacity: 0,
          y: 30
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out"
        },
        "-=0.2" // Start slightly before the previous animation ends
      )
      .set(landingSceneRef.current, {
        display: 'none'
      });

  }, { scope: containerRef });

  // Context-safe transition function
  const triggerSceneTransition = contextSafe(() => {
    if (tl.current && !isActive) {
      setIsActive(true);
      tl.current.play();
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const call = async () => {
    if (!query.trim() || isStreaming) return;

    // Trigger scene transition if not active
    if (!isActive) {
      triggerSceneTransition();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const currentQuery = query;
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: currentQuery,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      await fetchEventSource('http://127.0.0.1:8000/llmcall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentQuery }),
        onmessage(event) {
          const data = event.data;
          
          if (data === '[DONE]') {
            const assistantMessage: Message = {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, assistantMessage]);
            setStreamingContent("");
            setIsStreaming(false);
          } else {
            setStreamingContent(prev => prev + data);
          }
        },
        onerror(err) {
          console.error('Stream error:', err);
          setIsStreaming(false);
        }
      });
    } catch (error) {
      console.error('Request failed:', error);
      setIsStreaming(false);
    }

    // Scroll to bottom after message is added
    setTimeout(scrollToBottom, 100);
  };

  return (
    <div ref={containerRef} className="h-screen w-full overflow-hidden">
      {/* Landing Scene */}
      <div 
        ref={landingSceneRef}
        className="landing-scene flex justify-center items-center h-screen w-full absolute inset-0"
      >
        <div className="flex flex-col justify-center items-center text-center space-y-12 h-screen w-1/3">
          <div className="flex flex-col text-2xl">
            <p className="font-merri font-bold">
              Private, grounded explanation
            </p>
            <p className="font-merri font-bold">
              with line-by-line citations.
            </p>
          </div>
          <div className="w-full flex flex-col space-y-2 bg-[#F5F5F5] border-1 border-[#E0E0E0] rounded-sm">
            <TextareaAutosize 
              className="w-full resize-none rounded-sm outline-none bg-[#F5F5F5] p-[18px] text-[#4d4d4d] font-merri text-xs" 
              placeholder="Ask about your legal document..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  call();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Chat Scene */}
      <div 
        ref={chatSceneRef}
        className="chat-scene hidden h-screen flex-col absolute inset-0"
      >
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="font-merri font-bold text-lg">Legal AI Assistant</h1>
              <p className="text-xs text-gray-500">Analyzing your legal documents</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              ref={(el) => {
                if (el && message.id === messages[messages.length - 1]?.id) {
                  // Animate the latest message
                  setTimeout(() => animateNewMessage(el, message.role === 'user'), 50);
                }
              }}
            >
              <div className={`max-w-3xl p-4 rounded-lg shadow-sm ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
              }`}>
                <div className="font-merri text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {/* Streaming message */}
          {isStreaming && (
            <div className="message flex justify-start">
              <div className="max-w-3xl p-4 rounded-lg rounded-bl-none bg-white text-gray-900 border border-gray-200 shadow-sm">
                <div className="font-merri text-sm whitespace-pre-wrap">
                  {streamingContent}
                  <span className="animate-pulse text-blue-500">▌</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-3 max-w-4xl mx-auto">
            <TextareaAutosize 
              className="flex-1 resize-none rounded-lg outline-none bg-gray-50 p-3 text-gray-700 font-merri text-sm border border-gray-200 focus:border-blue-500 focus:bg-white transition-colors" 
              placeholder="Continue the conversation..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  call();
                }
              }}
              disabled={isStreaming}
              maxRows={4}
            />
            <button 
              onClick={call}
              disabled={isStreaming || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors font-merri text-sm font-semibold"
            >
              {isStreaming ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
