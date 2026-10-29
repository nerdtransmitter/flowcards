import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FunctionDisplay = ({ toolCall, isDark }) => {
    const [expanded, setExpanded] = useState(false);
    const name = toolCall?.name || 'Function';
    const status = toolCall?.status || 'pending';
    const results = toolCall?.results;
    
    const parsedResults = (() => {
        if (!results) return null;
        try {
            return typeof results === 'string' ? JSON.parse(results) : results;
        } catch {
            return results;
        }
    })();
    
    const isError = results && (
        (typeof results === 'string' && /error|failed/i.test(results)) ||
        (parsedResults?.success === false)
    );
    
    const statusConfig = {
        pending: { icon: Clock, color: 'text-slate-400', text: 'Pending' },
        running: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        in_progress: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        completed: isError ? 
            { icon: AlertCircle, color: 'text-red-500', text: 'Failed' } : 
            { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        success: { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        failed: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' },
        error: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' }
    }[status] || { icon: Zap, color: 'text-slate-500', text: '' };
    
    const Icon = statusConfig.icon;
    const formattedName = name.split('.').pop().replace(/([A-Z])/g, ' $1').trim();
    
    return (
        <div className="mt-2 text-xs">
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                    "hover:bg-slate-50",
                    expanded ? "bg-slate-50 border-slate-300" : isDark ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"
                )}
            >
                <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>{formattedName}</span>
                {statusConfig.text && (
                    <span className={cn(isDark ? "text-slate-400" : "text-slate-500", isError && "text-red-600")}>
                        • {statusConfig.text}
                    </span>
                )}
                {!statusConfig.spin && (toolCall.arguments_string || results) && (
                    <ChevronRight className={cn("h-3 w-3 text-slate-400 transition-transform ml-auto", 
                        expanded && "rotate-90")} />
                )}
            </button>
            
            {expanded && !statusConfig.spin && (
                <div className={cn("mt-1.5 ml-3 pl-3 border-l-2 space-y-2", 
                    isDark ? "border-slate-600" : "border-slate-200")}>
                    {toolCall.arguments_string && (
                        <div>
                            <div className={cn("text-xs mb-1", isDark ? "text-slate-400" : "text-slate-500")}>
                                Parameters:
                            </div>
                            <pre className={cn("rounded-md p-2 text-xs whitespace-pre-wrap",
                                isDark ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-600")}>
                                {(() => {
                                    try {
                                        return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                                    } catch {
                                        return toolCall.arguments_string;
                                    }
                                })()}
                            </pre>
                        </div>
                    )}
                    {parsedResults && (
                        <div>
                            <div className={cn("text-xs mb-1", isDark ? "text-slate-400" : "text-slate-500")}>
                                Result:
                            </div>
                            <pre className={cn("rounded-md p-2 text-xs whitespace-pre-wrap max-h-48 overflow-auto",
                                isDark ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-600")}>
                                {typeof parsedResults === 'object' ? 
                                    JSON.stringify(parsedResults, null, 2) : parsedResults}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function MessageBubble({ message, isDark = false }) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };
    
    return (
        <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className={cn("h-10 w-10 border-2 border-black flex items-center justify-center mt-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                    isDark ? "bg-slate-700" : "bg-cyan-100")}>
                    <Zap className={cn("w-5 h-5", isDark ? "text-cyan-400" : "text-black")} />
                </div>
            )}
            <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
                {message.content && (
                    <div className="relative group/message">
                        <div className={cn(
                            "p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                            isUser 
                                ? "bg-pink-500 text-white" 
                                : isDark
                                    ? "bg-slate-800 border-slate-700 text-slate-200"
                                    : "bg-white"
                        )}>
                            {isUser ? (
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            ) : (
                            <ReactMarkdown 
                                className={cn("text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                                    isDark ? "prose-invert" : "prose-slate")}
                                components={{
                                    code: ({ inline, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group/code">
                                                <pre className={cn("rounded-lg p-3 overflow-x-auto my-2",
                                                    isDark ? "bg-slate-900 text-slate-100" : "bg-slate-900 text-slate-100")}>
                                                    <code className={className} {...props}>{children}</code>
                                                </pre>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 bg-slate-800 hover:bg-slate-700"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                                    }}
                                                >
                                                    <Copy className="h-3 w-3 text-slate-400" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <code className={cn("px-1 py-0.5 rounded text-xs",
                                                isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700")}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    a: ({ children, ...props }) => (
                                        <a {...props} target="_blank" rel="noopener noreferrer" 
                                           className="text-pink-600 hover:text-pink-700 underline font-bold">
                                            {children}
                                        </a>
                                    ),
                                    p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                                    ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                    h1: ({ children }) => <h1 className="text-lg font-semibold my-3">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-semibold my-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-semibold my-2">{children}</h3>,
                                    blockquote: ({ children }) => (
                                        <blockquote className={cn("border-l-4 pl-3 my-2 italic",
                                            isDark ? "border-slate-600 text-slate-400" : "border-black text-gray-700")}>
                                            {children}
                                        </blockquote>
                                    ),
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                        </div>
                        {!isUser && message.content && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCopyMessage}
                                className={cn(
                                    "absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/message:opacity-100 transition-opacity",
                                    isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"
                                )}
                            >
                                {copied ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                    <Copy className={cn("h-3 w-3", isDark ? "text-slate-300" : "text-slate-600")} />
                                )}
                            </Button>
                        )}
                    </div>
                )}
                
                {message.tool_calls?.length > 0 && (
                    <div className="space-y-1 mt-2">
                        {message.tool_calls.map((toolCall, idx) => (
                            <FunctionDisplay key={idx} toolCall={toolCall} isDark={isDark} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}