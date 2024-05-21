<script setup lang="ts">
import { ref, onMounted, reactive, computed, onBeforeUnmount } from 'vue';
import { socket } from '../socket';
import axios from 'axios';
import { useRoute } from 'vue-router';
import BiPencil from './svgs/BiPencil.vue';
import BiTrash from './svgs/BiTrash.vue';
import BiFlag from './svgs/BiFlag.vue';
import Send from './svgs/Send.vue';
import FaSend from './svgs/FaSend.vue';

const emit = defineEmits(['open-editpost', 'open-userpost', 'close-searchpost', 'open-media', 'open-report']);
const closeSearchPost = () => {
    emit('close-searchpost');
};

const props = defineProps<{
    searchInputValue: string;
    searchCategory: string;
}>();

const route = useRoute();

const currentUser = localStorage.getItem('username');
const currentUserId = localStorage.getItem('userId');
const currentUserImg = localStorage.getItem('userImg');

const posts = ref<any[]>([]);
const mediaItems = reactive(new Map<string, HTMLElement | null>());
const showFullCaption = reactive(new Map<string, boolean>());

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${date.toLocaleTimeString()}`;
};

const isCaptionLong = computed(() => (post: any) => {
    const words = post.caption.trim().split(/\s+/);
    return words.length > 300;
});

const toggleCaption = (post: any) => {
    const postId = post._id;
    if (showFullCaption.has(postId)) {
        showFullCaption.set(postId, !showFullCaption.get(postId));
    } else {
        showFullCaption.set(postId, true);
    }
    // Scroll to the post
    const postRef = document.getElementById(`post-${postId}`);
    if (postRef) {
        postRef.scrollIntoView({ behavior: 'smooth' });
    }
};

const isImage = (fileUrl: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const fileExtension = fileUrl?.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(fileExtension || '');
};

const isVideo = (fileUrl: string): boolean => {
    const videoExtensions = ['mp4'];
    const fileExtension = fileUrl?.split('.').pop()?.toLowerCase();
    return videoExtensions.includes(fileExtension || '');
};

const scrollMedia = (postId: string, direction: number) => {
    const mediaItemContainer = mediaItems.get(postId);
    if (mediaItemContainer) {
        const scrollAmount = mediaItemContainer.scrollLeft + direction * 220;
        mediaItemContainer.scrollTo({
            left: scrollAmount,
            behavior: 'smooth',
        });
    }
};

const limit = 10000000000;
const skip = ref(0);
const isFetching = ref(false);
const isLoading = ref(false);
const hasMorePosts = ref(true);
const allPosts = ref<any[]>([]);

const fetchPosts = async () => {
    isLoading.value = true;
    isFetching.value = true;

    //await new Promise(resolve => setTimeout(resolve, 1000));
    try {
        const response = await axios.get('/api/posts', { params: { limit, skip: skip.value } });
        allPosts.value = [...allPosts.value, ...response.data.posts];
        const newPosts = response.data.posts.map((post: any) => {
            const latestVersion = post.versions[post.versions.length - 1];
            return {
                ...latestVersion,
                _id: post._id,
                userImg: post.userImg,
                username: post.username,
                userId: post.userId,
                createdAt: latestVersion.createdAt,
            };
        });
        posts.value = [...posts.value, ...newPosts];
        skip.value += limit;
        if (newPosts.length < limit) {
            hasMorePosts.value = false;
        }
    } catch (error) {
        //console.error('Failed to fetch posts:', error);
    } finally {
        isFetching.value = false;
        isLoading.value = false;
    }
};

const postModifiedDate = computed(() => (post: any) => {
    const versionCount = allPosts.value.find((p: any) => p._id === post._id)?.versions.length || 0;
    if (versionCount > 1) {
        return `last modified on ${formatDate(allPosts.value.find((p: any) => p._id === post._id)?.versions[versionCount - 1].createdAt)}`;
    } else {
        return `on ${formatDate(allPosts.value.find((p: any) => p._id === post._id)?.versions[0].createdAt)}`;
    }
});

const handleScroll = async (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10 && !isFetching.value) {
        fetchPosts();
    }
};

const deletePost = (postId: string) => {
    // try {
    //     await axios.delete(`/api/deletepost/${postId}`);
    //     posts.value = posts.value.filter((post: any) => post._id !== postId);
    // } catch (error) {
    //     console.error('Failed to delete post:', error);
    // }
    socket.emit('deletePost', postId, currentUserId);
};

socket.on('postDeleted', (postId, userId) => {
    posts.value = posts.value.filter((post: any) => post._id !== postId);
    // if (userId === currentUserId) {
    //     allPosts.value = allPosts.value.filter((post: any) => post._id !== postId);
    // }
});

const confirmDelete = (postId: string) => {
    if (confirm('Are you sure you want to delete this post? All chats related to this post will be deleted as well. This action cannot be undone.')) {
        deletePost(postId);
    }
};

// Messages
const conversationId = ref<string>('');
const conversationPostId = ref<string>('');
const postChatDict = reactive<{ [key: string]: any[] }>({});

const handleDirectMessage = async (post: any) => {
    const postId = post._id;
    const sendMessageDiv = document.getElementById(`send-message-${postId}`) as HTMLElement;
    const messageActionDiv = document.getElementById(`message-action-${postId}`) as HTMLElement;
    const messageInputDiv = document.getElementById(`message-input-${postId}`) as HTMLElement;
    if (messageActionDiv?.style.display === 'none' && messageInputDiv?.style.display === 'none') {
        messageActionDiv.style.display = 'flex';
        messageInputDiv.style.display = 'flex';
        sendMessageDiv.classList.add('hidden');
    } else {
        messageActionDiv.style.display = 'none';
        messageInputDiv.style.display = 'none';
        sendMessageDiv.classList.remove('hidden');
    }
    const postUserId = post.userId;
    const postTopic = post.topic;
    const postUsername = post.username;
    const postUserImg = post.userImg;
    const payload = {
        postId,
        postTopic,
        postUserId,
        postUsername,
        postUserImg,
        selfUserId: currentUserId || '',
        selfUsername: currentUser || '',
        selfUserImg: currentUserImg || '',
    };
    try {
        const response = await axios.post('/api/chatinit', payload);
        if (response.status === 404) {
            alert(response.data.message);
            posts.value = posts.value.filter((post: any) => post._id !== postId);
            return;
        }
        conversationId.value = response.data.conversation._id;
        conversationPostId.value = response.data.conversation.postId;
        if (!postChatDict[postId]) {
            postChatDict[postId] = [conversationId.value];
        }
    } catch (error) {
        //console.error('Failed to open chat:', error);
    }
};

onMounted(() => {
    fetchPosts();
    const postContainer = document.querySelector('.post-container');
    if (postContainer) {
        postContainer.addEventListener('scroll', handleScroll);
    }

});

onBeforeUnmount(() => {
    const postContainer = document.querySelector('.post-container');
    if (postContainer) {
        postContainer.removeEventListener('scroll', handleScroll);
    }
});


const searchQuery = ref('');
const filteredPosts = computed(() => {
    const postsToSearch = ref<any[]>([]);
    const queryWords = searchQuery.value.toLowerCase().split(/\s+/);
    if (props.searchCategory === "postId") {
        postsToSearch.value = posts.value.filter((post) => post._id === props.searchInputValue);
    } else if (props.searchCategory === "userId") {
        postsToSearch.value = posts.value.filter((post) => post.userId === props.searchInputValue);
    } else {
        postsToSearch.value = posts.value;
        queryWords.push(props.searchInputValue.toLowerCase());
    }
    return postsToSearch.value.filter((post) => {
        const idMatch = queryWords.every((word) => post._id.toLowerCase().includes(word));
        const userIdMatch = queryWords.every((word) => post.userId.toLowerCase().includes(word));
        const usernameMatch = queryWords.every((word) => post.username.toLowerCase().includes(word));
        const topicMatch = queryWords.every((word) => post.topic.toLowerCase().includes(word));
        const captionMatch = queryWords.every((word) => post.caption.toLowerCase().includes(word));
        const locationMatch = post.location ? queryWords.every((word) => post.location.toLowerCase().includes(word)) : false;
        const statusMatch = queryWords.every((word) => post.status.toLowerCase().includes(word));
        const priceMatch = post.price ? queryWords.every((word) => String(post.price).includes(word)) : false;
        const dateTimeMatch = queryWords.every((word) => formatDate(post.createdAt).includes(word));

        return (
        idMatch ||
        userIdMatch ||
        usernameMatch ||
        topicMatch ||
        captionMatch ||
        locationMatch ||
        statusMatch ||
        priceMatch ||
        dateTimeMatch
        );
    });
});

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
    const messageInput = document.getElementById(`input-message-${postId}`) as HTMLInputElement;
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
            socket.emit('sendMessage', newMessage);
            messageInput.value = '';
        } else if (event instanceof MouseEvent) {
            const newMessage = {
                conversationId: postConversationId,
                userRole: userRole,
                userId: localStorage.getItem('userId'),
                username: localStorage.getItem('username'),
                content: escapeHtml(messageContent),
                createdAt: new Date().toISOString(),
            };
            socket.emit('sendMessage', newMessage);
            messageInput.value = '';
        }
    }
};
</script>

<template>
    <div class="wrapper">
        <div class="searchpost-header">
            <div :style="{ visibility: props.searchCategory === 'postId' ? 'hidden' : 'visible' }" class="search-bar">
                <input type="search" placeholder="Search ..." id="searchInput" v-model="searchQuery">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                    <path fill="currentColor" d="m226.83 221.17l-52.7-52.7a84.1 84.1 0 1 0-5.66 5.66l52.7 52.7a4 4 0 0 0 5.66-5.66M36 112a76 76 0 1 1 76 76a76.08 76.08 0 0 1-76-76" />
                </svg>
            </div>
            <div class="close-btn" @click="closeSearchPost">&#10006;</div>
        </div>
        <div class="post-container" ref="postContainer">
            <div class="post" v-for="post in filteredPosts" :key="post._id" :id="`post-${post._id}`">
                <div class="post-head">
                    <div class="post-user">
                        <img :src="post.userImg ? post.userImg : 'https://marketplace.tuanle.top/yotes-logo.png'" alt="profile" />
                        <div class="post-user-info">
                            <h3 style="color: white;" @click="$emit('open-userpost', post.userId, 'userId')">{{ post.username }}</h3>
                            <h5 style="color: #D5D5D5;">{{ postModifiedDate(post) }}</h5>
                        </div>
                    </div>
                    <div class="post-options">
                        <button class="btn-post-option btn-post-edit" v-if="post.username === currentUser && currentUser" title="Edit" @click="$emit('open-editpost', post)">
                            <BiPencil />
                        </button>
                        <button class="btn-post-option btn-post-delete" v-if="post.username === currentUser && currentUser" title="Delete" @click="confirmDelete(post._id)">
                            <BiTrash />
                        </button>
                        <button class="btn-post-option btn-post-report" v-if="post.username !== currentUser && currentUser" title="Report" @click="$emit('open-report', post._id)">
                            <BiFlag />
                        </button>
                    </div>
                </div>
                <div class="post-topic">
                    <p>{{ post.topic }}</p>
                </div>
                <div class="post-caption">
                    <p v-if="!isCaptionLong(post) || showFullCaption.get(post._id)">
                        {{ post.caption }}
                        <button v-if="isCaptionLong(post)" @click="toggleCaption(post)">Show less...</button>
                    </p>
                    <p v-else>
                        {{ post.caption.substring(0, 300).trim() }}...
                        <button @click="toggleCaption(post)">Show more...</button>
                    </p>
                </div>
                <div class="media-post">
                    <button class="post-nav-btn" @click="scrollMedia(post._id, -1)">&#10094;</button>
                    <div class="media-post-items" :ref="el => mediaItems.set(post._id, el as HTMLElement)">
                        <div v-for="(file, index) in post.uploaded" :key="index" class="media-post-item-wrapper" v-if="post.uploaded.filter((media: any) => media.media).length">
                            <div class="media-post-item">
                                <img @click="$emit('open-media', file.media)" v-if="isImage(file.media)" :src="file.media" alt="Post media" />
                                <div @click.prevent="$emit('open-media', file.media)" v-else-if="isVideo(file.media)">
                                    <video  :src="file.media" controls controlslist="nodownload"></video>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="post-nav-btn" @click="scrollMedia(post._id, 1)">&#10095;</button>
                </div>
                <div class="bottom-bar">
                    <div class="post-details">
                        <div class="detail-price-status">
                            <p class="post-detail-price">{{ post.price ? '$' + parseFloat(post.price).toFixed(2) : 'Free' }}</p>
                            <p class="post-detail-status" :class="{
                                'available': post.status === 'Available',
                                'sold': post.status === 'Sold',
                                'not-available': post.status === 'Not Available',
                                'looking-for': post.status === 'Looking For...'
                            }">{{ post.status }}</p>
                        </div>
                        <div class="location-div">
                            <p class="post-detail-location" v-if="post.location">at {{ post.location }}</p>
                        </div>
                    </div>
                    <div :id="`send-message-${post._id}`" class="send-message" v-if="post.username !== currentUser && currentUser" @click="handleDirectMessage(post)">
                        <p class="btn-mess btn-message"><span>Send Message </span>
                            <Send />
                        </p>
                    </div>
                    <div :id="`message-action-${post._id}`" class="message-action" style="display: none;">
                        <button class="btn btn-close" @click="handleDirectMessage(post)">Discard</button>
                        <p class="btn-mess btn-send-message" @click="sendMessage($event, post._id, post.username, postChatDict[post._id][0])"><span>Send</span>
                            <FaSend />
                        </p>
                    </div>
                </div>
                <div :id="`message-input-${post._id}`" class="message-input" style="display: none;">
                    <input :id="`input-message-${post._id}`" type="text" placeholder="Type a short message..." @keydown.enter="sendMessage($event, post._id, post.username, postChatDict[post._id][0])" />
                </div>
            </div>
            <div v-if="isFetching && hasMorePosts && posts.length > 0" class="loading">
                Loading more posts...
            </div>
        </div>
    </div>
</template>

<style scoped>
.wrapper {
    height: 85vh;
    width: 100vh;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    /* justify-content: flex-end;
    align-items: flex-start; */
    justify-content: center;
    background-color: #212529;
    border-radius: 30px;
    padding-top: 5px;
}
.post-container {
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 84vh;
    width: 100%;
    position: fixed;
    padding: 50px 0 10px 0;
}
.searchpost-header {
    display: flex;
    width: 90%;
    padding: 6px 45px 5px 30px;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    background-color: #212529;
    border-radius: 10px;
    margin-top: -5px;
    z-index: 1;
}
.search-bar {
    width: 50%;
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
    background-color: #fff8;
    box-shadow: 0 .1rem .4rem #0002;
}
.search-bar svg {
    background-color: transparent;
    color: #212529;
    width: 2.5em;
    height: 2.5em;
}
.search-bar input {
    color: black;
    width: calc(100% - 40px);
    height: 100%;
    padding: 0 .5rem .1rem .3rem;
    background-color: transparent;
    border: none;
    outline: none;
    flex: 1;
}
.search-bar input::placeholder {
    color: #434548;
}
.close-btn {
    background-color: transparent;
    color: white;
    font-size: 1.5em;
    cursor: pointer;
}
.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    color: white;
    margin-top: -5px;
}
.post {
    width: 90%;
    border: solid 1px white;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 10px;
}
.post-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}
.post-topic p {
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: bold;
    color: white;
    border: none;
    border-bottom: 1px solid #ccc;
}
.btn-post-option {
    background-color: transparent;
    color: white;
    cursor: pointer;
    padding: 5px;
    margin: 0;
    border: none;
    transition: color 0.3s ease;
}
.btn-post-edit:hover {
    color: #39ff23;
    transition: color 0.3s ease;
}
.btn-post-delete:hover {
    color: #ff2323;
    transition: color 0.3s ease;
}
.btn-post-report:hover {
    color: #ff8c00;
    transition: color 0.3s ease;
}
.post-user {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
}
.post-user-info {
    display: flex;
    flex-direction: column;
    align-items: baseline;
}
.post-user img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 50%;
}
.post-user h5, .post-user p {
    margin-left: 5px;
}
.post-user h3:hover {
    cursor: pointer;
    text-decoration: underline;
}
.post-caption {
    margin-top: 10px;
    color: white;
    white-space: pre-wrap;
}
.post-caption button {
    background-color: rgba(82, 82, 82, 0.5);
    cursor: pointer;
    padding: 5px;
    margin: 0;
    font-size: 16px;
    color: rgba(213, 213, 213, 0.5);
    border: none;
    border-radius: 20px;
    transition: background-color 0.3s ease, color 0.3s ease;
}
.post-caption button:hover {
    background-color: rgba(190, 190, 190, 0.5);
    color: white;
    transition: background-color 0.3s ease, color 0.3s ease;
}
.post-details {
    display: flex;
    gap: 10px;
}
.detail-price-status {
    display: flex;
    gap: 5px;
}
.bottom-bar {
    display: flex;
    align-items: start;
    justify-content: space-between;
    margin-top: 15px;
    white-space: nowrap;
}
.post-detail-price {
    background-color: #ffe45f;
    color: rgb(172, 1, 1);
    font-weight: bold;
    padding: 5px;
    border-radius: 10px;
}
.post-detail-status {
    color: rgb(0, 0, 0);
    font-weight: bold;
    padding: 5px;
    border-radius: 10px;
}
.post-detail-location {
    color: white;
    padding: 5px;
    border-radius: 10px;
    border: solid 1px white;
}
.btn-mess {
    background-color: #238aff;
    color: white;
    font-weight: bold;
    padding: 5px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.btn-mess:hover {
    background-color: #0f5aff;
    transition: background-color 0.3s ease;
}
.btn-mess svg {
    margin-bottom: -5px;
}
.btn-send-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}
.btn-send-message span {
    font-weight: bold;
}
.available {
    background-color: #84ff84;
}
.sold {
    background-color: #ff9292;
}
.not-available {
    background-color: #ffffff;
}
.looking-for {
    background-color: #52cbff;
}
.media-post {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
}
.media-post img, .media-post video {
    height: 200px;
    border-radius: 10px;
    object-fit: contain;
    cursor: pointer;
}
.media-post-item {
    position: relative;
    display: inline-block;
    overflow: hidden;
    border-radius: 10px;
    min-height: 200px;
}
.media-post-item-wrapper:hover::before {
    opacity: 1;
}

.visible {
    opacity: 1;
    visibility: visible;
}

.hidden {
    opacity: 0;
    visibility: hidden;
}
.media-post:hover .post-nav-btn {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    background-color: rgba(82, 82, 82, 0.5);
}
.post-nav-btn {
    position: absolute;
    top: 45%;
    transform: translateY(-50%);
    background-color: transparent;
    border: none;
    padding: 10px;
    cursor: pointer;
    z-index: 1;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s ease, visibility 0.3s ease, background-color 0.3s ease;
    color: black;
}
.post-nav-btn:hover {
    background-color: rgba(190, 190, 190, 0.5) !important;
    transition: background-color 0.3s ease !important;
}
.post-nav-btn:first-child {
    left: 0;
}

.post-nav-btn:last-child {
    right: 0;
}
.media-post-items {
    display: flex;
    overflow-x: auto;
    scroll-behavior: smooth;
    gap: 10px;
}
.message-input {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
}
.message-input input {
    width: 100%;
    height: 40px;
    padding: 0 10px;
    border: solid 1px white;
    border-radius: 20px;
    outline: none;
    background-color: transparent;
    color: white;
}
.bottom-bar .message-action {
    box-sizing: border-box;
    flex-basis: 4rem;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    padding: 0 0.5rem 0 1.5rem;
    margin-top: -0.67rem;
}
.bottom-bar .message-action svg {
    height: 20px;
    fill: white;
    cursor: pointer;
    transition: fill 200ms;
    margin: 0 0.1rem;
}
.bottom-bar .send-message {
    margin-top: -0.8em;
}
.bottom-bar .send-message span {
    font-weight: bold;
}
.btn-close {
    padding: 10px;
    border-radius: 10px;
    border: none;
    color: white;
    cursor: pointer;
    margin: 0 10px;
    font-size: 14px;
    font-weight: bold;
    transition: .2s ease-in-out;
    background-color: red;
}
.btn-close:hover {
    background-color: #cd0000;
}

@media screen and (max-height: 800px) and (min-width: 600px) {
    .post {
        width: 90%;
    }
    .post-head {
        margin-bottom: 3px;
    }
    .post-topic p {
        font-size: 16px;
    }
    .post-caption p {
        font-size: 14px;
    }
    .media-post img, .media-post video {
        height: 180px;
    }
    .media-post-item {
        min-height: 180px;
    }
    .post-detail-price, .post-detail-status, .post-detail-location {
        margin-top: -10px;
        font-size: 14px;
    }
    /* .post:last-child {
        margin-bottom: 2em;
    } */
    .loading {
        margin-bottom: 2em;
    }

    .bottom-bar .message-action {
        padding: 0 0.5rem 0 1.5rem;
        margin-left: -4.5rem;
    }
}
@media screen and (max-height: 950px) and (max-width: 600px) {
    .post-head {
        margin-bottom: 3px;
    }
    .post-topic p {
        font-size: 16px;
    }
    .post-caption p {
        font-size: 14px;
    }
    .media-post img, .media-post video {
        height: 180px;
    }
    .media-post-item {
        min-height: 180px;
    }
    .post-detail-price, .post-detail-status, .post-detail-location {
        margin-top: -10px;
        font-size: 14px;
    }
    /* .post:last-child {
        margin-bottom: 7em;
    } */
    .loading {
        margin-bottom: 7em;
    }

    .scroll-down-button {
        top: 5rem;
    }
    .message-media-items img, .message-media-items video {
        height: 200px;
    }
}
@media screen and (max-width: 1025px) {
    .wrapper {
        width: 90vw;
        margin-left: 0rem;
    } 
}
@media screen and (max-width: 675px) {
    .wrapper {
        width: 90vw;
        margin-left: -0.5rem;
    }
    .bottom-bar .message-action {
        padding: 0rem 0rem 0 1.5rem;
        margin-left: -150px;
    }
}
@media screen and (max-width: 600px) {
    .post-user-info {
        font-size: 12px;
        margin-left: -5px;
    }
    .location-div {
        left: 0;
    }
    .bottom-bar .message-action button {
        padding: 0 10px;
    }
    .bottom-bar .send-message span {
        display: none;
    }
    .bottom-bar .message-action span {
        display: none;
    }
    .bottom-bar .message-action button, .bottom-bar .message-action p {
        font-size: 10px;
    }
    .bottom-bar .message-action svg {
        height: 20px;
    }
    .post-head {
        margin-bottom: 3px;
    }
    .post-topic p {
        font-size: 14px;
    }
    .post-caption p {
        font-size: 12px;
    }
    .media-post img, .media-post video {
        height: 150px;
    }
    .media-post-item {
        min-height: 150px;
    }
    .post-details {
        flex-direction: column;
        flex-wrap: wrap;
    }
    .detail-price-status {
        display: flex;
        flex-direction: row;
        margin-bottom: 5px;
    }
    .location-div {
        flex-basis: 100%;
    }
    .post-detail-price, .post-detail-status, .post-detail-location {
        margin-top: -10px;
        font-size: 10px;
    }
    .btn-message {
        padding: 1px 6px 3px 6px;
    }
    .btn-message svg {
        height: 18px;
    }
    .message-input input {
        height: 30px;
        font-size: 12px;
    }
}
@media screen and (max-width: 431px) {
    .wrapper {
        margin-left: 0rem;
    }
    .message-input input {
        height: 25px;
        font-size: 10px;
    }
}
</style>
