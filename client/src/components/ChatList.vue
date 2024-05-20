<script setup lang="ts">
import { socket, updateUserStatus, handleUserStatusUpdate, handleDisconnect, markMessagesAsSeen } from '@/socket';
import { useUserStatusStore } from '@/stores/userStatusStore';
import axios from 'axios';
import { computed, onMounted, reactive, ref, watch } from 'vue';

const currentUserId = localStorage.getItem('userId');

const props = defineProps({
    showChatList: {
        type: Boolean,
        required: true,
    },
});

const loading = ref(false);
let conversations = ref<any[]>([]);

const fetchChatList = () => {
    loading.value = true;
    socket.emit('fetchChatList', currentUserId);
};

onMounted(() => {
    fetchChatList();
});

watch(() => props.showChatList, (newValue) => {
    if (newValue) {
        fetchChatList();
    }
});

const sortConversations = (conversations: any[]) => {
    return conversations.sort((a, b) => {
        const aDate = new Date(a.messages[a.messages.length - 1].createdAt);
        const bDate = new Date(b.messages[b.messages.length - 1].createdAt);
        return bDate.getTime() - aDate.getTime();
    });
};

socket.on('chatList', (fetchConversations) => {
    if (fetchConversations) {
        conversations.value = fetchConversations.map((conversation: any) => ({
            ...conversation,
            unreadMessages: conversation.messages.filter((message: any) => message.status === 'unseen' && message.userId !== currentUserId).length,
        }));
        sortConversations(conversations.value);
        loading.value = false;
    }
});

socket.on('newMessage', (newMessageConversation) => {
    const index = conversations.value.findIndex((conversation) => conversation._id === newMessageConversation._id);
    const unreadNewMessages = newMessageConversation.messages.filter((message: any) => message.status === 'unseen' && message.userId !== currentUserId).length;
    if (index !== -1) {
        conversations.value[index] = newMessageConversation;
        conversations.value[index].unreadMessages = unreadNewMessages;
    } else {
        conversations.value.unshift(newMessageConversation);
        conversations.value[0].unreadMessages = unreadNewMessages;
    }
    sortConversations(conversations.value);
    loading.value = false;
});

// Search
const removeToneSymbols = (str: string) => {
    if (!str) return '';
    const toneSymbols = /[\u0300-\u036f]/g;
    return str.normalize('NFD').replace(toneSymbols, '');
};

const searchInput = ref('');
const handleSearch = computed(() => {
    const queryWords = searchInput.value.toLowerCase().split(/\s+/);
    return conversations.value.filter((conversation) => {
        const postUsernameMatch = queryWords.every((word) => conversation.postUsername.toLowerCase().includes(word));
        const selfUsernameMatch = queryWords.every((word) => conversation.selfUsername.toLowerCase().includes(word));
        const contentMatch = conversation.messages.some((message: any) => queryWords.every((word) => message.content?.toLowerCase().includes(word)));
        const contentMatchNml = conversation.messages.some((message: any) => queryWords.every((word) => removeToneSymbols(message.content?.toLowerCase()).includes(word)));

        return (
        postUsernameMatch ||
        selfUsernameMatch ||
        contentMatch ||
        contentMatchNml
        );
    });
});

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

watch(() => conversations.value, () => {
    conversations.value.forEach((conversation) => {
        if (conversation.postUserId === currentUserId) {
            initializeUserStatus(conversation.selfUserId);
        } else {
            initializeUserStatus(conversation.postUserId);
        }
    });
}, { immediate: true });

// Mark messages as seen
const updateMessagesAsSeen = (conversationId: string) => {
    socket.emit('joinConversation', conversationId);
    const conversation = conversations.value.find((conversation) => conversation._id === conversationId);
    if (conversation) {
        const unseenMessages = conversation.messages.filter((message: any) => message.status !== 'seen' && message.userId !== currentUserId);
        if (unseenMessages.length > 0) {
            markMessagesAsSeen(conversationId, currentUserId!);
        }
    }
};

socket.on('updateMessageStatus', (newMessageConversation, totalSeen) => {
    const index = conversations.value.findIndex((conversation) => conversation._id === newMessageConversation._id);
    const unreadNewMessages = newMessageConversation.messages.filter((message: any) => message.status === 'unseen' && message.userId !== currentUserId).length;
    if (index !== -1) {
        conversations.value[index] = newMessageConversation;
        conversations.value[index].unreadMessages = unreadNewMessages;
    } else {
        conversations.value.unshift(newMessageConversation);
        conversations.value[0].unreadMessages = unreadNewMessages;
    }
    sortConversations(conversations.value);
});

// Delete single chat
const deleteSingleChat = (event: MouseEvent, deleteConversationId: string, deletedPostId: string, convPostUserId: string, convSelfUserId: string) => {
    if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
        event.stopPropagation();
        const clientUserId = convPostUserId === currentUserId ? convSelfUserId : convPostUserId;
        socket.emit('deleteConversation', deleteConversationId, deletedPostId, currentUserId, clientUserId);
    }
};
socket.on('conversationDeleted', (deleteConversationId, deletePostId, myUnseenLeft) => {
    conversations.value = conversations.value.filter((conversation) => conversation._id !== deleteConversationId);
    if (conversations.value.length === 0) {
        loading.value = true;
    }
});
</script>


<template>
    <div>
        <div class="center">
            <div class="contacts chatlist-contacts">
                <div class="contact-search">
                    <input type="text" placeholder="Search" v-model="searchInput">
                </div>
                <div v-if="loading" class="loader"></div>
                <div v-else class="contact" v-for="conversation in handleSearch" :key="conversation._id" @click="$emit('open-conversation', conversation); updateMessagesAsSeen(conversation._id);">
                    <div class="single-chat">
                        <div class="pic" :style="`background-image: url(${conversation.postUserId === currentUserId ? conversation.selfUserImg : conversation.postUserImg}); font-size: 8px;`"></div>
                        <div v-if="userStatusStore.userStatuses[conversation.postUserId === currentUserId ? conversation.selfUserId : conversation.postUserId]">
                            <div v-if="userStatusStore.userStatuses[conversation.postUserId === currentUserId ? conversation.selfUserId : conversation.postUserId].status === 'Online'" class="post-userstatus online">
                                <div class="badge">{{ conversation.unreadMessages === 0 ? '' : conversation.unreadMessages }}</div>
                            </div>
                            <div v-else-if="userStatusStore.userStatuses[conversation.postUserId === currentUserId ? conversation.selfUserId : conversation.postUserId].status === 'Offline'" class="post-userstatus offline">
                                <div class="badge">{{ conversation.unreadMessages === 0 ? '' : conversation.unreadMessages }}</div>
                            </div>
                        </div>
                        <div class="name">{{ conversation.postUserId === currentUserId ? conversation.selfUsername : conversation.postUsername }}</div>
                        <div class="message" v-if="conversation.messages[conversation.messages.length - 1].content" v-html="conversation.messages[conversation.messages.length - 1].content.replace(/\n/g, '<br>')"></div>
                        <div class="message" v-else-if="conversation.messages[conversation.messages.length - 1].uploaded.length > 0" style="font-weight: bold;">[Media] &#x25B6;</div>
                    </div>
                    <div class="delete-single-chat">
                        <svg @click="deleteSingleChat($event, conversation._id, conversation.postId, conversation.postUserId, conversation.selfUserId)" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 448 512">
                            <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                        </svg>
                    </div>
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
}
.center {
    position: absolute;
    right: 317px;
    top: 321px;
}
/* Search */
.contact-search {
    position: sticky;
    top: -1px;
    height: 30px;
    background-color: rgb(138, 138, 138);
    padding: 0 .8rem;
    border-radius: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
}
.contact-search input {
    color: black;
    padding: 0 .5rem .1rem .3rem;
    background-color: transparent;
    border: none;
    outline: none;
    flex: 1;
}

/* HTML: <div class="loader"></div> */
.loader {
    width: 65px;
    aspect-ratio: 1;
    position: relative;
    margin: 1rem auto;
}
.loader:before,
.loader:after {
    content: "";
    position: absolute;
    border-radius: 50px;
    box-shadow: 0 0 0 3px inset #fff;
    animation: l4 2.5s infinite;
}
.loader:after {
    animation-delay: -1.25s;
}
@keyframes l4 {
    0% {
        inset: 0 35px 35px 0;
    }
    12.5% {
        inset: 0 35px 0 0;
    }
    25% {
        inset: 35px 35px 0 0;
    }
    37.5% {
        inset: 35px 0 0 0;
    }
    50% {
        inset: 35px 0 0 35px;
    }
    62.5% {
        inset: 0 0 0 35px;
    }
    75% {
        inset: 0 0 35px 35px;
    }
    87.5% {
        inset: 0 0 35px 0;
    }
    100% {
        inset: 0 35px 35px 0;
    }
}
/* Contact */
.pic {
    width: 4rem;
    height: 4rem;
    background-size: cover;
    background-position: center;
    border-radius: 50%;
    margin-top: -0.3rem;
    margin-left: 1rem;
}
.contact {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.2rem;
    margin-bottom: -0.1rem;
}
.delete-single-chat svg {
    margin-right: 2rem;
    cursor: pointer;
    z-index: 1;
}
.delete-single-chat svg {
    fill: #999;
    transition: fill ease-in-out 0.2s;
}
.delete-single-chat svg:hover {
    fill: #ff0000;
    transition: fill ease-in-out 0.2s;
}
.single-chat {
    position: relative;
    padding-left: 5rem;
    height: 5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    cursor: pointer;
}
.contact:hover {
    background: #555;
}
.single-chat .pic {
    position: absolute;
    left: 0;
    margin-top: 0.1rem;
}
.single-chat .name {
    font-weight: 600;
    margin-bottom: 0.125rem;
    margin-left: 1rem;
}
.single-chat .message, .single-chat .seen {
    font-size: 0.9rem;
    color: #999;
    margin-left: 1rem;
}
.single-chat .message {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-right: 0.5rem;
}
.single-chat .badge {
    box-sizing: border-box;
    position: absolute;
    width: 1.5rem;
    height: 1.5rem;
    text-align: center;
    font-size: 0.9rem;
    border-radius: 1rem;
    top: 0;
    left: 2.5rem;
    font-weight: bold;
    margin-left: 1rem;
    margin-top: 0.3rem;
}
.contacts {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translate(-6rem, -57%);
    width: 24rem;
    height: 28rem;
    overflow-y: auto;
    box-sizing: border-box;
    border-radius: 1rem;
    background: #444;
    box-shadow: 0 0 8rem 0 rgba(0, 0, 0, 0.1), 2rem 2rem 4rem -3rem rgba(0, 0, 0, 0.5);
}
.contacts .single-chat:first-child {
    border-radius: 1rem 1rem 0 0;
}

.post-userstatus.online .badge {
    color: #444;
    background-color: rgb(10, 255, 51);
}
.post-userstatus.offline .badge {
    color: white;
    background-color: #333;
}
@media screen and (max-width: 450px) {
    .center {
        right: 260px;
        top: 321px;
    }
    .contacts {
        width: 22rem;
    }
}
@media screen and (max-width: 350px) {
    .center {
        right: 245px;
        top: 321px;
    }
    .contacts {
        width: 21rem;
    }
}
</style>