<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue';
import PlusBox from './svgs/PlusBox.vue';
import GridView from './svgs/GridView.vue';
import ListView from './svgs/ListView.vue';
import ChatIcon from './svgs/ChatIcon.vue';
import ChatList from './ChatList.vue';
import Messages from './Messages.vue';
import MediaPreview from './MediaPreview.vue';

import { socket, countTotalUnseenMessages } from '@/socket';

const emit = defineEmits(['open-newpost', 'open-searchpost', 'open-usersign', 'open-profile']);

const userId = computed(() => localStorage.getItem('userId'));
const username = computed(() => localStorage.getItem('username'));
const userImg = computed(() => localStorage.getItem('userImg'));

const props = defineProps<{
    searchInputValueReset: string;
}>();

const handleProfileClick = () => {
    if (username.value) {
        emit('open-profile');
    } else {
        emit('open-usersign');
    }
};

const handleLogoClick = () => {
    location.reload();
};

const searchInputValue = ref(props.searchInputValueReset);
const searchCategory = ref('');
const handleSearch = (searchInputValueToGo: string, searchCategoryToGo: string) => {
    if (searchInputValueToGo) {
        emit('open-searchpost', searchInputValueToGo, searchCategoryToGo);
    }
};

const handleViewPost = (postId: string) => {
    searchInputValue.value = postId;
    searchCategory.value = 'postId';
    handleSearch(searchInputValue.value, searchCategory.value);
};

watch(() => props.searchInputValueReset, (newValue: any) => {
    searchInputValue.value = newValue;
});

const isGridView = ref(false);
const showChatList = ref<boolean>(false);
const handleShowChatList = () => {
    if (showChatList.value) {
        showChatList.value = false;
    } else if (!showChatList.value && showConversation.value) {
        showConversation.value = false;
    } else if (!showChatList.value && !showConversation.value) {
        showChatList.value = true;
    }
};

const showConversation = ref(false);
const selectedConversation = ref<any>(null);
const handleOpenConversation = (conversation: any) => {
    showChatList.value = false;
    showConversation.value = true;
    selectedConversation.value = conversation;
};

const handleConversationClick = (conversation: any) => {
    //console.log('conversation clicked', conversation);
    selectedConversation.value = conversation;
};

const handleBackChatList = () => {
    setTimeout(() => {
        showChatList.value = true;
        showConversation.value = false;
    }, 100);
};

const handleChatDeleted = (isDeletedConversationOpened: boolean) => {
    if (isDeletedConversationOpened) {
        showConversation.value = false;
        showChatList.value = true;
    }
};

// let count = 0;
// let timeoutId: NodeJS.Timeout | null = null;
const handleDocumentClick = (event: MouseEvent) => {
    const chatListElement = document.getElementById('chat-list');
    if (
        (showChatList.value && chatListElement && !chatListElement.contains(event.target as Node))
    ) {
        showChatList.value = false;
    }
    // const messagesElement = document.getElementById('mess-component');
    // if (showConversation.value && selectedConversation.value) {
    //     if (count === 0 && messagesElement && !messagesElement.contains(event.target as Node)) {
    //         timeoutId = setTimeout(() => {
    //             if (count === 0) {
    //                 count += 1;
    //             }
    //         }, 1000);
    //     } else if (count === 1 && messagesElement && !messagesElement.contains(event.target as Node)) {
    //         showConversation.value = false;
    //         count = 0;
    //     }
    // }
};
// watch(() => selectedConversation.value, () => {
//     if (timeoutId !== null) {
//         clearTimeout(timeoutId);
//     }
//     count = 0;
// });

const totalUnseenMessage = reactive({ total: 0 });

socket.on('newMessage', (newComingMessage) => {
    if (newComingMessage.messages[newComingMessage.messages.length - 1].userId !== userId.value) {
        totalUnseenMessage.total += 1;
        const messageButton = document.querySelector('.message-group button') as HTMLButtonElement;
        if (totalUnseenMessage.total > 0) {
            messageButton.style.background = 'linear-gradient(45deg, rgba(209,51,51,1) 0%, rgba(209,51,51,1) 32%, rgba(201,69,252,1) 100%)';
        }
    }
});
socket.on('updateMessageStatus', (conversation, totalSeen) => {
    if (conversation.messages[conversation.messages.length - 1].userId !== userId.value) {
        totalUnseenMessage.total -= totalSeen;
        const messageButton = document.querySelector('.message-group button') as HTMLButtonElement;
        if (totalUnseenMessage.total === 0) {
            messageButton.style.background = 'transparent';
            messageButton.addEventListener('mouseenter', () => {
                messageButton.style.backgroundColor = 'white';
            });

            messageButton.addEventListener('mouseleave', () => {
                messageButton.style.backgroundColor = 'transparent';
            });
        }
    }
});

socket.on('conversationDeleted', (deleteConversationId, deletePostId, theUnseenLeft) => {
    totalUnseenMessage.total -= theUnseenLeft;
    const messageButton = document.querySelector('.message-group button') as HTMLButtonElement;
    if (totalUnseenMessage.total === 0) {
        messageButton.style.background = 'transparent';
        messageButton.addEventListener('mouseenter', () => {
            messageButton.style.backgroundColor = 'white';
        });

        messageButton.addEventListener('mouseleave', () => {
            messageButton.style.backgroundColor = 'transparent';
        });
    }
});

onMounted(() => {
    if (userId.value) {
        countTotalUnseenMessages(userId.value);
    };
    socket.on('unseenMessagesTotal', (data: number) => {
        totalUnseenMessage.total = data;
        const messageButton = document.querySelector('.message-group button') as HTMLButtonElement;
        if (totalUnseenMessage.total > 0) {
            messageButton.style.background = 'linear-gradient(45deg, rgba(209,51,51,1) 0%, rgba(209,51,51,1) 32%, rgba(201,69,252,1) 100%)';
        }
    });
    document.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick);
});

// Open Media Preview
const showMediaPreview = ref<boolean>(false);
const mediaSrc = ref<string>('');
const handleOpenMedia = (mediaUrl: string) => {
    mediaSrc.value = mediaUrl;
    showMediaPreview.value = true;
};
</script>

<template>
    <div class="header">
        <div class="logo">
            <img src="../assets/branding.png" alt="Yotes Marketplace" @click="handleLogoClick" />
        </div>
        <div v-if="userId" class="new-post">
            <button @click="$emit('open-newpost')">
                <PlusBox />
                <span>New Post</span>
            </button>
        </div>
        <div class="grid-view" v-if="!isGridView">
            <button @click="isGridView = true">
                <GridView />
                <span>View As Grid (soon)</span>
            </button>
        </div>
        <div class="list-view" v-if="isGridView">
            <button @click="isGridView = false">
                <ListView />
                <span>View As List (soon)</span>
            </button>
        </div>
        <div class="search-bar">
            <input type="search" placeholder="Search ..." id="searchInput" v-model="searchInputValue" @keyup.enter="handleSearch(searchInputValue, 'regular')">
            <svg @click="handleSearch(searchInputValue, 'regular')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                <path fill="currentColor" d="m226.83 221.17l-52.7-52.7a84.1 84.1 0 1 0-5.66 5.66l52.7 52.7a4 4 0 0 0 5.66-5.66M36 112a76 76 0 1 1 76 76a76.08 76.08 0 0 1-76-76" />
            </svg>
        </div>
        <div class="profile" @click="handleProfileClick">
            <img :src="userImg ?? 'https://marketplace.tuanle.top/yotes-logo.png'" alt="profile" />
            <p v-if="!username">Login/Sign Up</p>
            <h3>{{ username ? username : 'Login/Sign Up' }}</h3>
        </div>
        <div v-if="username" class="message-group" id="chat-list">
            <button @click="handleShowChatList">
                <ChatIcon />
                <p v-if="totalUnseenMessage.total > 0" style="font-weight: bold;">{{ totalUnseenMessage.total }}</p>
                <span>Messages</span>
            </button>
            <ChatList v-if="showChatList" :show-chat-list="showChatList" @open-conversation="handleOpenConversation" />
            <Messages v-if="showConversation && selectedConversation" :selected-conversation="selectedConversation" @update:selected-conversation="handleConversationClick" @view-post="handleViewPost" @chat-deleted="handleChatDeleted" @open-media="handleOpenMedia" @back-chatlist="handleBackChatList" />
            <transition name="fade">
                <div v-if="showMediaPreview" class="mediapreview-overlay modal-container">
                    <div class="media-preview modal-inner">
                    <MediaPreview :mediaSrc="mediaSrc" @close-mediapreview="showMediaPreview = false" />
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>

<style scoped>
/* Media Preview */
.modal-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}
.modal-inner {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    max-width: 800px;
}
.media-preview {
    max-width: 650px;
}
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

/* Header */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 30px;
    background-color: #333;
    color: white;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    /* min-width: 800px; */
    font-size: 16px;
}
button {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
    border: solid 1px white;
    background-color: transparent;
    color: white;
    padding: 10px;
    border-radius: 10px;
    transition: .2s ease-in-out;
    font-weight: bold;
    font-size: 16px;
}
button span {
    font-weight: bold;
    font-size: 16px;
}
button:hover {
    background-color: #f0f0f0;
    color: black;
    transition: .2s ease-in-out;
    cursor: pointer;
}
.logo{
    padding: 0;
    margin: -10px 0 -18px 0;
}
.logo img {
    height: 60px;
    padding: 0;
    margin: 0;
}
.logo img:hover {
    cursor: pointer;
}
.search-bar {
    width: 100px;
    height: 40px;
    background-color: #fff5;
    padding: 0 .8rem;
    border-radius: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: .2s;
}

.search-bar:hover {
    width: 200px;
    background-color: #fff8;
    box-shadow: 0 .1rem .4rem #0002;
}

.search-bar svg {
    background-color: transparent;
    color: #212529;
    width: 2.5em;
    height: 2.5em;
    margin-left: 10px;
    cursor: pointer;
}

.search-bar input {
    color: black;
    width: calc(100% - 40px);
    height: 100%;
    background-color: transparent;
    border: none;
    outline: none;
    flex: 1;
}
.messages-group {
    margin-bottom: -16.5rem;
    background-color: #f0f0f0;
    border-radius: 10px;
    padding: 10px;
    box-shadow: 0 .1rem .4rem #0002;
}
.profile {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
    border: solid 1px white;
    padding: 5px 10px;
    border-radius: 10px;
    transition: .2s ease-in-out;
}
.profile p {
    display: none;
}
.profile img {
    width: 30px;
    height: 30px;
    object-fit: cover;
    border-radius: 50%;
}
.profile:hover {
    background-color: #f0f0f0;
    color: black;
    transition: .2s ease-in-out;
    cursor: pointer;
}
@media screen and (max-width: 1025px) {
    .search-bar {
        width: 50px;
        padding: 0 .1rem;
    }
    .search-bar:hover {
        width: 90px;
    }
    .search-bar svg {
        padding: 0;
    }
    .search-bar:hover svg {
        display: none;
    }
    .search-bar:hover input {
        padding-left: 10px;
    }
}
@media screen and (max-width: 950px) {
    button span {
        display: none;
    }
    .search-bar:hover {
        width: 150px;
    }
}
@media screen and (max-width: 580px) {
    .profile h3 {
        display: none;
        white-space: nowrap;
    }
    .profile p {
        display: block;
        font-size: 10px;
    }
    .search-bar:hover ~ .profile p {
        display: none;
    }
    .logo img {
        height: 50px;
    }
}
@media screen and (max-width: 450px) {
    .header {
        padding: 10px 5px;
    }
    .logo {
        margin-left: -5px;
    }
    .grid-view, .list-view {
        display: none;
    }
    .search-bar:hover {
        width: 100px;
    }
}
</style>