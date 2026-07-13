"use client";

import { useState } from "react";
import { Conversation } from "@/types";
import ConversationList from "./conversation-list";
import ChatArea from "./chat-area";
import ExchangeQuickPanel from "./exchange-quick-panel";
import { MessageSquareDashed } from "lucide-react";

interface Props {
  conversations: Conversation[];
  currentUserId: string;
  activeConversation?: Conversation;
}

export default function WorkspaceLayout({ conversations, currentUserId, activeConversation }: Props) {
  // Mobile layout state to toggle between list and chat
  const [showMobileList, setShowMobileList] = useState(!activeConversation);

  return (
    <div className="flex w-full h-full bg-background border-t border-border">
      
      {/* Left Sidebar - Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border bg-surface shrink-0 flex flex-col ${!showMobileList ? "hidden md:flex" : "flex"}`}>
        <ConversationList 
          conversations={conversations} 
          currentUserId={currentUserId} 
          activeConversationId={activeConversation?.id}
          onSelect={() => setShowMobileList(false)}
        />
      </div>

      {/* Main Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-background ${showMobileList ? "hidden md:flex" : "flex"}`}>
        {activeConversation ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border">
              <ChatArea 
                conversation={activeConversation} 
                currentUserId={currentUserId} 
                onBack={() => setShowMobileList(true)}
              />
            </div>
            
            {/* Right Sidebar - Quick Panel (Hidden on smaller screens, can be toggled if needed) */}
            <div className="w-80 bg-surface shrink-0 hidden xl:flex flex-col">
              <ExchangeQuickPanel conversation={activeConversation} currentUserId={currentUserId} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-secondary/30 hidden md:flex">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <MessageSquareDashed className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-heading mb-3">Start a conversation.</h2>
            <p className="text-muted max-w-sm">Every collaboration begins with a message. Select an exchange from the sidebar to open the workspace.</p>
          </div>
        )}
      </div>

    </div>
  );
}
