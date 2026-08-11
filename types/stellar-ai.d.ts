/**
 * TypeScript Type Definitions for Stellar AI
 * 
 * Type definitions for better code safety.
 * 
 * @module StellarAITypes
 * @version 1.0.0
 * @author Adriano To The Star
 */

declare namespace StellarAI {
    interface Chat {
        id: string;
        title: string;
        messages: Message[];
        createdAt: string;
        updatedAt: string;
    }

    interface Message {
        id: string;
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
        model?: string;
    }

    interface User {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    }

    interface Planet {
        id: string;
        name: string;
        type: string;
        distance: number;
        discovered: string;
        claimed?: boolean;
    }
}

declare class StellarAI {
    currentChatId: string | null;
    chats: StellarAI.Chat[];
    currentUser: StellarAI.User | null;
    selectedModel: string;
    
    constructor();
    init(): Promise<void>;
    sendMessage(): Promise<void>;
    createNewChat(): StellarAI.Chat;
    clearCurrentChat(): void;
    exportChat(): void;
}

declare interface Window {
    stellarAI: StellarAI;
    usePrompt: (prompt: string) => void;
    hideLoginModal: () => void;
    handleLogin: (event: Event) => void;
}

