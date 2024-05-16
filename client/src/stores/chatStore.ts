import { defineStore } from 'pinia';

export const useChatStore = defineStore({
    id: 'chat',
    state: () => ({
        chatHistories: {} as { [postId: string]: any[] },
    }),
    actions: {
        addChatHistory(postId: string, chatHistory: any[]) {
            this.chatHistories[postId] = chatHistory;
        },
        updateChatHistory(postId: string, newMessage: any) {
            if (this.chatHistories[postId]) {
                this.chatHistories[postId].push(newMessage);
            }
        },
    },
});