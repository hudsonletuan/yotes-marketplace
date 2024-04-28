<script setup lang="ts">
import { ref, onMounted, reactive, computed, onBeforeUnmount } from 'vue';
import axios from 'axios';

const currentUser = localStorage.getItem('username');

const posts = ref<any[]>([]);
const mediaItems = reactive(new Map<string, HTMLElement | null>());
const showFullCaption = reactive(new Map<string, boolean>());

// const fetchPosts = async () => {
//     try {
//         const response = await axios.get('/posts', axiosConfig);
//         posts.value = response.data.posts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
//     } catch (error) {
//         console.error('Failed to fetch posts:', error);
//     }
// };

// onMounted(() => {
//     fetchPosts();
// });

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
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

const limit = 3;
const skip = ref(0);
const isFetching = ref(false);

const fetchPosts = async () => {
    isFetching.value = true;
    try {
        const response = await axios.get('/api/posts', { params: { limit, skip: skip.value } });
        posts.value = [...posts.value, ...response.data.posts];
        skip.value += limit;
    } catch (error) {
        console.error('Failed to fetch posts:', error);
    } finally {
        isFetching.value = false;
    }
};

const handleScroll = async (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10 && !isFetching.value) {
        fetchPosts();
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
</script>

<template>
    <div class="post-container" ref="postContainer">
        <div class="post" v-for="post in posts" :key="post._id" :id="`post-${post._id}`">
            <div class="post-user">
                <img :src="post.userImg ? post.userImg : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'" alt="profile" />
                <div class="post-user-info">
                    <h3>{{ post.username }}</h3>
                    <h5><span>on </span>{{ formatDate(post.createdAt) }}</h5>
                    <p v-if="post.location">at {{ post.location }}</p>
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
                        'not-available': post.status === 'Not Available'
                    }">{{ post.status }}</p>
                </div>
                <div class="send-message" v-if="post.username !== currentUser">
                    <p class="btn-message">Send Message 
                        <svg fill="currentColor" height="auto" width="20px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 491.022 491.022" xml:space="preserve"><g><g><path d="M490.916,13.991c-0.213-1.173-0.64-2.347-1.28-3.307c-0.107-0.213-0.213-0.533-0.32-0.747 c-0.107-0.213-0.32-0.32-0.533-0.533c-0.427-0.533-0.96-1.067-1.493-1.493c-0.427-0.32-0.853-0.64-1.28-0.96 c-0.213-0.107-0.32-0.32-0.533-0.427c-0.32-0.107-0.747-0.32-1.173-0.427c-0.533-0.213-1.067-0.427-1.6-0.533 c-0.64-0.107-1.28-0.213-1.92-0.213c-0.533,0-1.067,0-1.6,0c-0.747,0.107-1.493,0.32-2.133,0.533 c-0.32,0.107-0.747,0.107-1.067,0.213L6.436,209.085c-5.44,2.347-7.893,8.64-5.547,14.08c1.067,2.347,2.88,4.373,5.227,5.44 l175.36,82.453v163.947c0,5.867,4.8,10.667,10.667,10.667c3.733,0,7.147-1.92,9.067-5.12l74.133-120.533l114.56,60.373 c5.227,2.773,11.627,0.747,14.4-4.48c0.427-0.853,0.747-1.813,0.96-2.667l85.547-394.987c0-0.213,0-0.427,0-0.64 c0.107-0.64,0.107-1.173,0.213-1.707C491.022,15.271,491.022,14.631,490.916,13.991z M190.009,291.324L36.836,219.218 L433.209,48.124L190.009,291.324z M202.809,437.138V321.831l53.653,28.267L202.809,437.138z M387.449,394.898l-100.8-53.013 l-18.133-11.2l-0.747,1.28l-57.707-30.4L462.116,49.298L387.449,394.898z"></path></g></g></svg>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.post-container {
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 80vh;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    margin-top: 80px;
}
.post {
    width: 600px;
    border: solid 1px white;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 20px;
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