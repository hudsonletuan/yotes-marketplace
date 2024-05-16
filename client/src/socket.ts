import { io } from 'socket.io-client';
import { computed } from 'vue';

const userId = computed(() => localStorage.getItem('userId'));

const socket = io('http://localhost:5000');

socket.on('connect', () => {
    updateUserStatus('Online', socket.id);
});

socket.on('disconnect', () => {
    updateUserStatus('Offline', socket.id);
});

socket.on('userStatusUpdate', ({ userId, userStatus, lastActive }) => {
    //console.log(userId, userStatus, lastActive);
});

const updateUserStatus = (userStatus: string, socketId?: string) => {
    socket.emit('updateUserStatus', { userId: userId.value, userStatus });
    if (socketId) {
        localStorage.setItem('socketId', socketId);
    }
};

const handleUserStatusUpdate = (callback: (data: { userId: string; userStatus: string; lastActive: Date }) => void) => {
    socket.on('userStatusUpdate', callback);
};

const handleDisconnect = (callback: () => void) => {
    socket.on('disconnect', callback);
};

const sendMessage = (conversationId:string, message: string) => {
    socket.emit('sendMessage', { conversationId, message });
};

const markMessagesAsSeen = (conversationId: string, userId: string) => {
    socket.emit('markMessagesAsSeen', conversationId, userId);
};
const countTotalUnseenMessages = (userId: string) => {
    socket.emit('countUnseenMessages', userId);
};
export { socket, updateUserStatus, sendMessage, handleUserStatusUpdate, handleDisconnect, markMessagesAsSeen, countTotalUnseenMessages };