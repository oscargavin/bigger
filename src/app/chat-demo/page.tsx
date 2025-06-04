import { ChatMessageListDemo } from "@/components/demo/chat-message-list-demo";

export default function ChatDemoPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Chat Component Demo</h1>
          <p className="text-muted-foreground">
            A beautiful chat interface with auto-scrolling, loading states, and more.
          </p>
        </div>
        
        <ChatMessageListDemo />
        
        <div className="space-y-4 text-sm text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">Features</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Auto-scrolling chat messages</li>
            <li>Loading state with animated dots</li>
            <li>Sent/received message variants</li>
            <li>Avatar support with fallbacks</li>
            <li>File attachment and voice input buttons (ready for implementation)</li>
            <li>Smooth scrolling with scroll-to-bottom button</li>
          </ul>
        </div>
      </div>
    </div>
  );
}