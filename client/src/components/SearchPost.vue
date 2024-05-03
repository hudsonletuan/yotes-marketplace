<script setup lang="ts">
import { ref, onMounted, reactive, computed, onBeforeUnmount } from 'vue';
import axios from 'axios';
import BiPencil from './svgs/BiPencil.vue';
import BiTrash from './svgs/BiTrash.vue';
import BiFlag from './svgs/BiFlag.vue';
import Send from './svgs/Send.vue';

const emit = defineEmits(['open-editpost', 'open-userpost', 'close-searchpost']);
const closeSearchPost = () => {
    emit('close-searchpost');
};

const props = defineProps<{
    searchInputValue: string;
}>();

const currentUser = localStorage.getItem('username');

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
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg+xml', 'webp'];
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(fileExtension || '');
};

const isVideo = (fileUrl: string): boolean => {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'flv'];
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
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
        console.error('Failed to fetch posts:', error);
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

const deletePost = async (postId: string) => {
    try {
        await axios.delete(`/api/deletepost/${postId}`);
        posts.value = posts.value.filter((post: any) => post._id !== postId);
    } catch (error) {
        console.error('Failed to delete post:', error);
    }
};

const confirmDelete = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
        deletePost(postId);
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
    const queryWords = searchQuery.value.toLowerCase().split(/\s+/);
    queryWords.push(props.searchInputValue.toLowerCase());
    return posts.value.filter((post) => {
        const usernameMatch = queryWords.every((word) => post.username.toLowerCase().includes(word));
        const captionMatch = queryWords.every((word) => post.caption.toLowerCase().includes(word));
        const locationMatch = post.location ? queryWords.every((word) => post.location.toLowerCase().includes(word)) : false;
        const statusMatch = queryWords.every((word) => post.status.toLowerCase().includes(word));
        const priceMatch = post.price ? queryWords.every((word) => String(post.price).includes(word)) : false;
        const dateTimeMatch = queryWords.every((word) => formatDate(post.createdAt).includes(word));

        return (
        usernameMatch ||
        captionMatch ||
        locationMatch ||
        statusMatch ||
        priceMatch ||
        dateTimeMatch
        );
    });
});

</script>

<template>
    <div class="wrapper">
        <div class="searchpost-header">
            <div class="search-bar">
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
                        <img :src="post.userImg ? post.userImg : 'https://yotes-marketplace.s3.us-east-2.amazonaws.com/yotes-logo.png'" alt="profile" />
                        <div class="post-user-info">
                            <h3 style="color: white;" @click="$emit('open-userpost', post.username)">{{ post.username }}</h3>
                            <h5 style="color: #D5D5D5;">{{ postModifiedDate(post) }}</h5>
                        </div>
                    </div>
                    <div class="post-options">
                        <button class="btn-post-option btn-post-edit" v-if="post.username === currentUser" title="Edit" @click="$emit('open-editpost', post)">
                            <BiPencil />
                        </button>
                        <button class="btn-post-option btn-post-delete" v-if="post.username === currentUser" title="Delete" @click="confirmDelete(post._id)">
                            <BiTrash />
                        </button>
                        <button class="btn-post-option btn-post-report" title="Report">
                            <BiFlag />
                        </button>
                    </div>
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
                        <div v-for="(file, index) in post.uploaded" :key="index" class="media-post-item-wrapper">
                            <div class="media-post-item">
                                <img v-if="isImage(file.media)" :src="file.media" alt="Post media" />
                                <video v-else-if="isVideo(file.media)" :src="file.media" controls></video>
                            </div>
                        </div>
                    </div>
                    <button class="post-nav-btn" @click="scrollMedia(post._id, 1)">&#10095;</button>
                </div>
                <div class="bottom-bar">
                    <div class="post-details">
                        <p class="post-detail-price">{{ post.price ? '$' + post.price : 'Free' }}</p>
                        <p class="post-detail-status" :class="{
                            'available': post.status === 'Available',
                            'sold': post.status === 'Sold',
                            'not-available': post.status === 'Not Available',
                            'looking-for': post.status === 'Looking For...'
                        }">{{ post.status }}</p>
                        <p class="post-detail-location" v-if="post.location">at {{ post.location }}</p>
                    </div>
                    <div class="send-message" v-if="post.username !== currentUser">
                        <p class="btn-message">Send Message 
                            <Send />
                        </p>
                    </div>
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
    justify-content: flex-end;
    align-items: flex-start;
    background-color: #212529;
    border-radius: 30px;
    padding-top: 5px;
}
.post-container {
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 85vh;
    width: 100vh;
    position: fixed;
    padding: 50px 0 10px 0;
}
.searchpost-header {
    display: flex;
    width: 90%;
    padding: 10px 65px 5px 10px;
    margin-right: 20px;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    background-color: #212529;
    border-radius: 10px;
    margin-top: -5px;
    z-index: 1;
}
.search-bar {
    width: 40%;
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
    margin-left: 10px;
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
    width: 600px;
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
.bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    gap: 20px;
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
.btn-message {
    background-color: #238aff;
    color: white;
    font-weight: bold;
    padding: 5px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.btn-message:hover {
    background-color: #0f5aff;
    transition: background-color 0.3s ease;
}
.btn-message svg {
    margin-bottom: -5px;
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
</style>