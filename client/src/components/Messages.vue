<script setup lang="ts">
import { socket, updateUserStatus, handleUserStatusUpdate, handleDisconnect, markMessagesAsSeen } from '@/socket';
import axios from 'axios';
import { useUserStatusStore } from '@/stores/userStatusStore';
import FaCamera from './svgs/FaCamera.vue';
import FaLaugh from './svgs/FaLaugh.vue';
import FaSend from './svgs/FaSend.vue';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import ChatList from './ChatList.vue';
import EmojiPicker, { type EmojiExt } from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import Compressor from 'compressorjs';
import heic2any from 'heic2any';

const currentUserId = localStorage.getItem('userId');

const props = defineProps({
    selectedConversation: {
        type: Object,
        required: false,
        default: null,
    },
});

const emit = defineEmits<{
    (e: 'update:selectedConversation', conversation: any): void;
    (e: 'new-message', conversationId: string, message: any): void;
    (e: 'view-post', postId: string): void;
    (e: 'chat-deleted', isDeletedConversationOpened: boolean): void;
    (e: 'open-media', mediaSrc: string): void;
}>();

const onOpenConversation = (conversation: any) => {
    emit('update:selectedConversation', conversation);
};

const viewPost = (postId: string) => {
    emit('view-post', postId);
};

const showChatList = ref<boolean>(false);
const receiverUserId = ref('');

//Handle the online/offline status
const userStatusStore = useUserStatusStore();
// Initialize user status from backend
async function initializeUserStatus(postUserId: string) {
    try {
        const response = await axios.get(`/api/getuser/${postUserId}`);
        userStatusStore.setStatus(postUserId, response.data.user.userStatus);
        userStatusStore.setLastActive(postUserId, response.data.user.lastActive);
    } catch (error) {
        //console.error('Failed to fetch user status:', error);
    }
}

// Listen for real-time user status updates
handleUserStatusUpdate(({ userId, userStatus, lastActive }) => {
    userStatusStore.setStatus(userId, userStatus);
    userStatusStore.setLastActive(userId, lastActive);
});

handleDisconnect(() => {
    updateUserStatus('Offline');
});

// Handle time ago
function timeAgo(date: any) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years ago";
    }
    if (interval === 1) {
        return interval + " year ago";
    }

    const months = Math.floor(seconds / 2628000);
    if (months > 1) {
        return months + " months ago";
    }
    if (months === 1) {
        return months + " month ago";
    }

    const days = Math.floor(seconds / 86400);
    if (days > 1) {
        return days + " days ago";
    }
    if (days === 1) {
        return days + " day ago";
    }

    const hours = Math.floor(seconds / 3600);
    if (hours > 1) {
        return hours + " hours ago";
    }
    if (hours === 1) {
        return hours + " hour ago";
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes > 1) {
        return minutes + " minutes ago";
    }
    if (minutes === 1) {
        return minutes + " minute ago";
    }

    return "Just now";
}

const conversationChat = ref<any[]>([]);
const postUsername = ref('');

const scrollToBottom = (postId: string) => {
    nextTick(() => {
        setTimeout(() => {
            const chatElement = document.querySelector(`#chat-${postId}`);
            if (chatElement && chatElement.scrollHeight > 0) {
                const mediaElements = chatElement.querySelectorAll('img, video');
                const remainingMedia = Array.from(mediaElements).filter(
                (media): media is HTMLImageElement | HTMLVideoElement =>
                    (media instanceof HTMLImageElement && !media.complete) ||
                    (media instanceof HTMLVideoElement &&
                    (media.videoWidth === 0 && media.videoHeight === 0) ||
                    (media as HTMLMediaElement).readyState !== (media as HTMLMediaElement).HAVE_ENOUGH_DATA)
                );
                if (remainingMedia.length) {
                    setTimeout(scrollToBottom, 100, postId);
                } else {
                    chatElement.scrollTop = chatElement.scrollHeight;
                }
            }
        }, 100);
    });
    chatReady.value = true;
};

const resizeTextarea = (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = '2.3rem';
    textarea.style.height = textarea.scrollHeight + 'px';
};

const escapeHtml = (text: string) => {
    const entityMap: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (s) => entityMap[s]);
};

const sendMessage = (event: Event, postId: string, postUsernameCheck: string, postConversationId: string) => {
    const messageInput = document.getElementById(`messageInput-${postId}`) as HTMLTextAreaElement;
    const messageContent = messageInput.value.trim();
    let userRole = '';
    if (messageContent) {
        if (postUsernameCheck === localStorage.getItem('username')) {
            userRole = 'owner';
        } else {
            userRole = 'visitor';
        }
        if (event instanceof KeyboardEvent && event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const newMessage = {
                conversationId: postConversationId,
                userRole: userRole,
                userId: localStorage.getItem('userId'),
                username: localStorage.getItem('username'),
                content: escapeHtml(messageContent),
                createdAt: new Date().toISOString(),
            };
            conversationChat.value.push(newMessage);
            socket.emit('sendMessage', newMessage);
            emit('new-message', postConversationId, newMessage);
            messageInput.value = '';
            scrollToBottom(postId);
        } else if (event instanceof MouseEvent) {
            const newMessage = {
                conversationId: postConversationId,
                userRole: userRole,
                userId: localStorage.getItem('userId'),
                username: localStorage.getItem('username'),
                content: escapeHtml(messageContent),
                createdAt: new Date().toISOString(),
            };
            conversationChat.value.push(newMessage);
            socket.emit('sendMessage', newMessage);
            emit('new-message', postConversationId, newMessage);
            messageInput.value = '';
            scrollToBottom(postId);
        }
    }
};

const chatReady = ref(false);

watch(() => props.selectedConversation, (newConversation) => {
    chatReady.value = false;
    if (newConversation) {
        postUsername.value = newConversation.postUsername;
        conversationChat.value = newConversation.messages;
        if (newConversation.postUserId === currentUserId) {
            receiverUserId.value = newConversation.selfUserId;
            initializeUserStatus(receiverUserId.value);
        } else {
            receiverUserId.value = newConversation.postUserId;
            initializeUserStatus(receiverUserId.value);
        }
        scrollToBottom(newConversation.postId);
    }
}, { immediate: true });

socket.on('newMessage', (newMessageConversation) => {
    if (newMessageConversation.messages[newMessageConversation.messages.length - 1].userId !== currentUserId) {
        if (props.selectedConversation && props.selectedConversation._id === newMessageConversation._id) {
        conversationChat.value = newMessageConversation.messages;
        }
        if (newMessageConversation.messages[newMessageConversation.messages.length - 1].userId === currentUserId) {
            scrollToBottom(props.selectedConversation?.postId);
        }
    }
});

// Mark messages as seen
const updateMessagesAsSeen = (conversationId: string) => {
    markMessagesAsSeen(conversationId, currentUserId!);
};

socket.on('updateMessageStatus', (conversation, totalSeen) => {
    const myLastMessage = conversation.messages[conversation.messages.length - 1];
    if (myLastMessage.userId === currentUserId && myLastMessage.status === 'seen') {
        conversationChat.value[conversationChat.value.length - 1].status = 'seen';
    }
});

//Handle single message click
const handleSingleMessageClick = (messageId: string) => {
    const messageElement = document.querySelector(`.messId-${messageId}`) as HTMLElement;
    if (messageElement) {
        if (messageElement.style.display === 'none') {
            messageElement.style.display = 'block';
        } else {
            messageElement.style.display = 'none';
        }
    }
};

// Handle delete conversation
socket.on('conversationDeleted', (deleteConversationId, deletePostId, myUnseenLeft) => {
    const isDeletedConversationOpened = props.selectedConversation && props.selectedConversation._id === deleteConversationId;
    emit('chat-deleted', isDeletedConversationOpened);
});

// Handle emoji picker
const showEmojiPicker = ref(false);
const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
};
const addEmoji = (emoji: EmojiExt) => {
    const messageInput = document.getElementById(`messageInput-${props.selectedConversation?.postId}`) as HTMLTextAreaElement;
    messageInput.value += emoji.i;
    messageInput.focus();
};

// Handle file input
const triggerFileInputClick = () => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput.click();
};

const selectedMedia = ref<File[]>([]);
const objectURLs = ref<string[]>([]);
const ImageReady = ref(true);
const handleFileInputChange = async (event: Event, postId: string, postUsernameCheck: string, postConversationId: string) => {
    ImageReady.value = false;
    scrollToBottom(postId);
    selectedMedia.value = [];
    objectURLs.value = [];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const newFiles = Array.from((event.target as HTMLInputElement).files as FileList);
    if (!newFiles.length){
        ImageReady.value = true;
        return;
    };
    const validFiles = newFiles.filter((file) => {
        const isValidType = (file.type.startsWith('image/') && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(file.type.split('/')[1])) || 
        (file.type.startsWith('video/') && ['mp4'].includes(file.type.split('/')[1]));
        return isValidType && file.size <= MAX_FILE_SIZE;
    });
    const heicFiles = newFiles.filter((file) => file.name.toLocaleLowerCase().endsWith('.heic') || file.name.toLocaleLowerCase().endsWith('.heif'));
    const invalidFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length) {
        alert(`The following files exceed the maximum file size of 5MB: ${invalidFiles.map((file) => file.name).join(', ')}`);
    }
    if (!validFiles.length && !heicFiles.length) {
        ImageReady.value = true;
        alert('Invalid file(s) selected. Only jpg, jpeg, png, heic/heif, and mp4 are supported.')
        return;
    };
    if (heicFiles.length > 0) {
        const compressHeicf = heicFiles.map((file) => {
            return new Promise((resolve, reject) => {
                heic2any({ 
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.3,
                })
                .then((convertedBlob) => {
                    const convertedFile = new File([convertedBlob as BlobPart], file.name.replace(/\.heic$|\.heif$/i, '.jpeg'), { type: 'image/jpeg' });
                    selectedMedia.value.push(convertedFile);
                    const objectURL = URL.createObjectURL(convertedFile);
                    objectURLs.value.push(objectURL);
                    resolve(convertedFile);
                })
                .catch((error) => {
                    console.error(error);
                    reject(error);
                });
            });
        });
        await Promise.all(compressHeicf);
    }
    const compressionTasks = validFiles.map((file) => {
        if (file.type.startsWith('video/')) {
            const objectURL = URL.createObjectURL(file);
            objectURLs.value.push(objectURL);
            selectedMedia.value.push(file);
            return Promise.resolve(file);
        } else {
            return new Promise((resolve, reject) => {
                new Compressor(file, {
                    quality: 0.3,
                    success(result) {
                        const compressedFiles = new File([result], file.name, { type: file.type });
                        selectedMedia.value.push(compressedFiles);
                        const objectURL = URL.createObjectURL(compressedFiles);
                        objectURLs.value.push(objectURL);
                        resolve(compressedFiles);
                    },
                    error(error) {
                        console.error(error.message);
                        reject(error);
                    },
                });
            });
        }
    });

    const compressedFiles = await Promise.all(compressionTasks);
    // selectedMedia.value = validFiles;

    // validFiles.forEach((file) => {
    //     const objectURL = URL.createObjectURL(file);
    //     objectURLs.value.push(objectURL);
    // });

    const formData = new FormData();
    selectedMedia.value.forEach((file) => {
        formData.append('media', file);
    });
    formData.append('userId', localStorage.getItem('userId')!);
    formData.append('username', localStorage.getItem('username')!);
    const response = await axios.post(`/api/conversationmediaupload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    let userRole = '';
    if (postUsernameCheck === localStorage.getItem('username')) {
        userRole = 'owner';
    } else {
        userRole = 'visitor';
    }
    const newMessage = {
        conversationId: postConversationId,
        userRole: userRole,
        userId: localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
        uploaded: response.data.media,
        createdAt: new Date().toISOString(),
    };
    conversationChat.value.push(newMessage);
    socket.emit('sendMessage', newMessage);
    emit('new-message', postConversationId, newMessage);
    scrollToBottom(postId);
    ImageReady.value = true;
};

const isImage = (fileUrl: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'blob'];
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(fileExtension || '');
};
const isVideo = (fileUrl: string): boolean => {
    const videoExtensions = ['mp4'];
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
    return videoExtensions.includes(fileExtension || '');
};
const onMediaError = (event: Event, message: string) => {
    const target = event.target as HTMLImageElement | HTMLVideoElement;
    const boldItalicMessage = document.createElement('strong');
    boldItalicMessage.innerHTML = `<em>${message}</em>`;
    target.parentNode?.replaceChild(boldItalicMessage, target);
};
</script>


<template>
    <div>
        <div class="center">
            <div class="contacts">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="50" width="50" viewBox="0 0 512 512">
                    <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"/>
                </svg>
                <h2>CONTACTS</h2>
                <div class="list-chat">
                    <ChatList v-if="props.selectedConversation" :showChatList="true" @open-conversation="onOpenConversation" />
                </div>
            </div>
            <div class="chat" @click="updateMessagesAsSeen($props.selectedConversation!._id)">
                <div class="header-bar">
                    <div class="contact bar">
                        <div class="post-user-img" :style="`background-image: url(${$props.selectedConversation?.postUserId === currentUserId ? $props.selectedConversation?.selfUserImg : $props.selectedConversation?.postUserImg});`"></div>
                        <div class="post-username">{{ $props.selectedConversation?.postUserId === currentUserId ? $props.selectedConversation?.selfUsername : $props.selectedConversation?.postUsername }}</div>
                        <div v-if="userStatusStore.userStatuses[receiverUserId]">
                            <div v-if="userStatusStore.userStatuses[receiverUserId].status === 'Online'" class="post-userstatus online">&#128905; {{ userStatusStore.userStatuses[receiverUserId].status }}</div>
                            <div v-else-if="userStatusStore.userStatuses[receiverUserId].status === 'Offline'" class="post-userstatus offline">&#128905; {{ timeAgo(userStatusStore.userStatuses[receiverUserId].lastActive) }}</div>
                        </div>
                    </div>
                    <div class="view-post" @click="viewPost($props.selectedConversation!.postId)">
                        View Post
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="20" width="20"viewBox="0 0 512 512">
                            <path d="M217.9 105.9L340.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L217.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1L32 320c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM352 416l64 0c17.7 0 32-14.3 32-32l0-256c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c53 0 96 43 96 96l0 256c0 53-43 96-96 96l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/>
                        </svg>
                    </div>
                </div>
                <div v-show="chatReady" class="scroll-down-button" @click="scrollToBottom($props.selectedConversation?.postId)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                        <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/>
                    </svg>
                </div>
                <div :id="`chat-${$props.selectedConversation?.postId}`" class="messages" ref="messagesContainer">
                    <div v-show="!chatReady" class="loadingMessages">
                        <div class="loader"></div>
                    </div>
                    <div v-show="chatReady" class="message" v-for="message in conversationChat as any" :class="message.userId !== currentUserId ? `post-mess` : `my-mess`" :key="message._id" @click="handleSingleMessageClick(message._id)">
                        <div v-if="message.content" v-html="message.content.replace(/\n/g, '<br>')"></div>
                        <div v-else class="message-media">
                            <div class="message-media-items">
                                <div v-for="(file, index) in message.uploaded" :key="index" class="message-media-item-wrapper">
                                    <div class="message-media-item">
                                        <img @click="$emit('open-media', file.media)" v-if="file && isImage(file.media)" :src="file.media" alt="Image" @error="onMediaError($event, '[Invalid file]')" />
                                        <div @click.prevent="$emit('open-media', file.media)" v-else-if="file && isVideo(file.media)">
                                            <video  :src="file.media" controls controlslist="nodownload" @error="onMediaError($event, '[Invalid file]')"></video>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div :class="`messId-${message._id}`" style="display: none; font-size: 0.7rem">{{ new Date(message.createdAt).toLocaleString() }}</div>
                    </div>
                    <div v-show="chatReady && conversationChat.length > 0 && conversationChat[conversationChat.length - 1].userId === currentUserId && conversationChat[conversationChat.length - 1].status === 'seen'" class="seen-container">
                        <div class="seen">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z"/></svg>
                        </div>
                    </div>
                    <div v-show="!ImageReady" class="loadingImages">
                        <div class="loader-img"></div>
                    </div>
                    <!-- <div class="message post-mess">
                        <div class="typing typing-1"></div>
                        <div class="typing typing-2"></div>
                        <div class="typing typing-3"></div>
                    </div> -->
                </div>
                <div class="emoji-picker" v-if="showEmojiPicker">
                    <EmojiPicker :disabled-groups="['flags']" :visible="showEmojiPicker" @select="addEmoji" @close="toggleEmojiPicker" />
                </div>
                <div class="input">
                    <FaCamera @click="triggerFileInputClick" />
                    <input id="file-input" type="file" accept="image/*, video/mp4" multiple @change="handleFileInputChange($event, $props.selectedConversation?.postId, postUsername, $props.selectedConversation?._id)" style="display: none" />
                    <FaLaugh @click="toggleEmojiPicker" />
                    <textarea :id="`messageInput-${$props.selectedConversation?.postId}`" placeholder="Type your message here!" @input="resizeTextarea" @keydown.enter="sendMessage($event, $props.selectedConversation?.postId, postUsername, $props.selectedConversation?._id)"></textarea>
                    <FaSend @click="sendMessage($event, $props.selectedConversation?.postId, postUsername, $props.selectedConversation?._id)" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
body, html {
    font-weight: 400;
    line-height: 1.25em;
    letter-spacing: 0.025em;
    color: #333;
    background: #F7F7F7;
}
.center {
    position: absolute;
    right: 29px;
    top: 65px;
}
.post-user-img {
    width: 3.5rem;
    height: 3.5rem;
    background-size: cover;
    background-position: center;
    border-radius: 50%;
}
.contact {
    position: relative;
    margin-bottom: 1rem;
    padding-left: 5rem;
    height: 4.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
.contact .post-user-img {
    position: absolute;
    left: 0;
}
.contact .post-username {
    font-size: 1.125rem;
    font-weight: 600;
    margin-left: -0.9rem;
    margin-bottom: -0.2rem;
}
.contact .pic {
    position: absolute;
    left: 0;
}
.contact .name {
    font-weight: 600;
    margin-bottom: 0.125rem;
}
.contact .message, .contact .seen {
    font-size: 0.9rem;
    color: #999;
}
.contact .badge {
    box-sizing: border-box;
    position: absolute;
    width: 1.5rem;
    height: 1.5rem;
    text-align: center;
    font-size: 0.9rem;
    border-radius: 1rem;
    top: 0;
    left: 2.5rem;
    background: #333;
    color: white;
}
.contacts {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translate(-5.9rem, -50%);
    width: 24rem;
    height: 32rem;
    padding: 1rem 2rem 1rem 1rem;
    box-sizing: border-box;
    border-radius: 1rem 0 0 1rem;
    cursor: pointer;
    background: #333;
    box-shadow: 0 0 8rem 0 rgba(0, 0, 0, 0.1), 2rem 2rem 4rem -3rem rgba(0, 0, 0, 0.5);
    transition: transform 500ms;
}
.contacts h2 {
    margin: -0.1rem 0 1.5rem 5rem;
}
.contacts svg {
    position: absolute;
    top: 0.5rem;
    left: 1.48rem;
    color: #656565;
    transition: color 200ms;
}
.contacts svg:hover {
    color: #999;
}
.contacts:hover {
    transform: translate(-23rem, -50%);
}

/* List Chat Section */
.list-chat {
    position: absolute;
    top: 0rem;
    right: -1.8rem;
}

/* Chat Section */
.header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -0.5rem;
    margin-bottom: -0.8rem;
}
.loadingMessages {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}
/* HTML: <div class="loader"></div> */
.loader {
    width: 90px;
    height: 14px;
    box-shadow: 0 3px 0 #fff;
    position: relative;
    display: grid;
    clip-path: inset(-60px 0 -5px)
}
.loader:after {
    content: "";
    position: relative;
    background: repeating-linear-gradient(90deg,#0000 0 calc(50% - 8px), #ccc 0 calc(50% + 8px), #0000 0 100%) 0 0/calc(100%/3) 100%;
    animation: l6-1 1s infinite;
} 
.loader:before {
    content: "";
    position: absolute;
    width: 14px;
    aspect-ratio: 1;
    left: calc(50% - 7px);
    bottom: 0;
    border-radius: 50%;
    background: lightblue;
    animation: l6-2 1s infinite;
}
@keyframes l6-1 {
    50%,100% {background-position: calc(100%/2) 0}
}
@keyframes l6-2 {
    0%,50% {transform:translateY(-80px)}
}

.loadingImages{
    display: flex;
    justify-content: center;
    align-items: center;
}
/* HTML: <div class="loader"></div> */
.loader-img{
    width: 40px;
    aspect-ratio: 1;
    --c:no-repeat linear-gradient(#ffffff 0 0);
    background: 
        var(--c) 0    0,
        var(--c) 0    100%, 
        var(--c) 50%  0,  
        var(--c) 50%  100%, 
        var(--c) 100% 0, 
        var(--c) 100% 100%;
    background-size: 8px 50%;
    animation: l7-0 1s infinite;
    position: relative;
    overflow: hidden;
}
.loader-img:before {
    content: "";
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ffffff;
    top: calc(50% - 4px);
    left: -8px;
    animation: inherit;
    animation-name: l7-1;
}

@keyframes l7-0 {
    16.67% {background-size:8px 30%, 8px 30%, 8px 50%, 8px 50%, 8px 50%, 8px 50%}
    33.33% {background-size:8px 30%, 8px 30%, 8px 30%, 8px 30%, 8px 50%, 8px 50%}
    50%    {background-size:8px 30%, 8px 30%, 8px 30%, 8px 30%, 8px 30%, 8px 30%}
    66.67% {background-size:8px 50%, 8px 50%, 8px 30%, 8px 30%, 8px 30%, 8px 30%}
    83.33% {background-size:8px 50%, 8px 50%, 8px 50%, 8px 50%, 8px 30%, 8px 30%}
}

@keyframes l7-1 {
    20%  {left:0px}
    40%  {left:calc(50%  - 4px)}
    60%  {left:calc(100% - 8px)}
    80%,
    100% {left:100%}
}
.chat {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 24rem;
    height: 38rem;
    z-index: 2;
    box-sizing: border-box;
    border-radius: 1rem;
    background: #333;
    box-shadow: 0 0 8rem 0 rgba(0, 0, 0, 0.1), 0rem 2rem 4rem -3rem rgba(0, 0, 0, 0.5);
}
.chat .contact.bar {
    flex-basis: 3.5rem;
    flex-shrink: 0;
    margin: 1rem;
    box-sizing: content-box;
}
.post-userstatus {
    white-space: nowrap;
    margin-left: -1rem;
}
.post-userstatus.online {
    color: rgb(10, 255, 51);
}
.post-userstatus.offline {
    color: #666;
}
.view-post {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #999;
    margin-right: 1rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border: solid 2px #999;
    border-radius: 2rem;
    transition: ease-in-out 200ms;
}
.view-post:hover {
    border: solid 2px white;
    color: white;
    transition: ease-in-out 200ms;
}
.scroll-down-button {
    position: absolute;
    top: 6rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    opacity: 0.5;
}
.scroll-down-button:hover {
    opacity: 1;
    transition: opacity 200ms;
}
.scroll-down-button svg {
    position: sticky;
    width: 2rem;
    height: 2rem;
    background: #333;
    border-radius: 50%;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-bottom: -2rem;
}
.chat .messages {
    height: 28.3rem;
    padding: 1rem;
    background: #212529;
    flex-shrink: 2;
    overflow-y: auto;
    box-shadow: inset 0 2rem 2rem -2rem rgba(0, 0, 0, 0.05), inset 0 -2rem 2rem -2rem rgba(0, 0, 0, 0.05);
}
.chat .messages .time {
    font-size: 0.8rem;
    background: #EEE;
    padding: 0.25rem 1rem;
    border-radius: 2rem;
    color: #999;
    width: fit-content;
    margin: 0 auto;
}
.chat .messages .message {
    font-weight: 500;
    box-sizing: border-box;
    padding: 0.5rem 1rem;
    margin: 1rem;
    background: #FFF;
    border-radius: 1.125rem 1.125rem 1.125rem 0;
    min-height: 2.25rem;
    width: fit-content;
    max-width: 66%;
    box-shadow: 0 0 2rem rgba(0, 0, 0, 0.075), 0rem 1rem 1rem -1rem rgba(0, 0, 0, 0.1);
}
.chat .messages .message.my-mess {
    margin: -0.7rem -0.5rem 1rem auto;
    border-radius: 1.125rem 1.125rem 0 1.125rem;
    background: #333;
    color: white;
}
.chat .messages .message.post-mess {
    margin: -0.7rem auto 1rem -0.5rem;
    border-radius: 1.125rem 1.125rem 1.125rem 0;
    background: #FFF;
    color: #333;
}
.chat .messages .message .typing {
    display: inline-block;
    width: 0.8rem;
    height: 0.8rem;
    margin-right: 0rem;
    box-sizing: border-box;
    background: #ccc;
    border-radius: 50%;
}
.chat .messages .message .typing.typing-1 {
    animation: typing 3s infinite;
}
.chat .messages .message .typing.typing-2 {
    animation: typing 3s 250ms infinite;
}
.chat .messages .message .typing.typing-3 {
    animation: typing 3s 500ms infinite;
}
.chat .input {
    box-sizing: border-box;
    flex-basis: 4rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.5rem 0 1.5rem;
}
.chat .input svg {
    height: 25px;
    margin-right: 1rem;
    fill: #666;
    cursor: pointer;
    transition: fill 200ms;
}
.chat .input svg:hover {
    fill: white;
}
.chat .input textarea{
    font-family: 'Open Sans', sans-serif;
    border: none;
    background-image: none;
    background-color: white;
    padding: 0.5rem 1rem;
    margin-right: 1rem;
    margin-top: .5rem;
    margin-bottom: .5rem;
    border-radius: 1.125rem;
    flex-grow: 2;
    box-shadow: 0 0 1rem rgba(0, 0, 0, 0.1), 0rem 1rem 1rem -1rem rgba(0, 0, 0, 0.2);
    font-weight: 400;
    letter-spacing: 0.025em;
    height: 2.3rem;
    max-height: 5rem;
    overflow-y: auto;
    resize: vertical;
}
.chat .input textarea:placeholder {
    color: #999;
}
.seen {
    font-weight: 500;
    box-sizing: border-box;
    padding: 0.5rem 1rem;
    min-height: 2.25rem;
    width: fit-content;
    max-width: 66%;
    box-shadow: 0 0 2rem rgba(0, 0, 0, 0.075), 0rem 1rem 1rem -1rem rgba(0, 0, 0, 0.1);
    margin: -1.3rem -1rem -1rem auto;
    color: white;
}
.emoji-picker {
    position: absolute;
    bottom: 3.5rem;
    right: 18rem;
    z-index: 3;
}
.message-media {
    margin-top: 0.5rem;
}
.message-media-items img, .message-media-items video {
    max-width: 100%;
    border-radius: 10px;
    object-fit: contain;
    cursor: pointer;
}
@keyframes typing {
    0%, 75%, 100% {
        transform: translate(0, 0.25rem) scale(0.9);
        opacity: 0.5;
    }
    25% {
        transform: translate(0, -0.25rem) scale(1);
        opacity: 1;
    }
}

</style>