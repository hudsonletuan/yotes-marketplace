<script setup lang="ts">
import { ref, onMounted, reactive, computed, onBeforeUnmount, nextTick } from 'vue';
import axios from 'axios';
import FaCamera from './svgs/FaCamera.vue';
import FaLaugh from './svgs/FaLaugh.vue';
import FaSend from './svgs/FaSend.vue';
import BiPencil from './svgs/BiPencil.vue';
import BiTrash from './svgs/BiTrash.vue';
import BiFlag from './svgs/BiFlag.vue';
import FaShare from './svgs/FaShare.vue';
import FaCopy from './svgs/FaCopy.vue';
import Send from './svgs/Send.vue';
import { useUserStatusStore } from '@/stores/userStatusStore';
import { socket, updateUserStatus, handleUserStatusUpdate, handleDisconnect, markMessagesAsSeen } from '@/socket';
import { watch } from 'vue';
import EmojiPicker, { type EmojiExt } from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import Compressor from 'compressorjs';
import heic2any from 'heic2any';

const emit = defineEmits(['open-editpost', 'open-userpost', 'open-media', 'open-report']);

const currentUserId = localStorage.getItem('userId');
const currentUser = localStorage.getItem('username');
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
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'blob'];
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

const limit = 10;
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
        await fetchPosts();
    }
};

const deletePost = (postId: string) => {
    // try {
    //     await axios.delete(`/api/deletepost/${postId}`);
    //     posts.value = posts.value.filter((post: any) => post._id !== postId);
    // } catch (error) {
    //     //console.error('Failed to delete post:', error);
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

const isThisPost = ref('');
const showFaShare = ref('');
const sharePost = async (postId: string) => {
    const postUrl = `${window.location.origin}/${postId}`;
    try {
        await navigator.clipboard.writeText(postUrl);
        isThisPost.value = postId;
        showFaShare.value = postId;
        setTimeout(() => {
            isThisPost.value = '';
            setTimeout(() => {
                showFaShare.value = '';
            }, 300);
        }, 1000);
    } catch (error) {
        //console.error('Failed to copy post URL:', error);
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

//Handle the chat section
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
        isLoadingChat.value[postId] = false;
    });
};

const showChat = ref(false);

const postsWithOpenChat = reactive<any[]>([]);
const conversationId = ref('');
const conversationPostId = ref('');
const postChatDict = reactive<{ [key: string]: any[] }>({});

const isLoadingChat = ref<{ [key: string]: boolean }>({}); // { postId: boolean }

const togglePostChat = async (post: any) => {
    const postId = post._id;
    if (!postsWithOpenChat.some(postsWithOpenChat => postsWithOpenChat['postId'] === postId)) {
        isLoadingChat.value[postId] = true;
    }
    const postUserId = post.userId;
    const index = postsWithOpenChat.findIndex((chat: any) => chat.postId === postId);
    if (index !== -1) {
        postsWithOpenChat.splice(index, 1);
    } else {
        postsWithOpenChat.push({ postId, postUserId });
    }
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
        const totalMessage = response.data.conversation.messages.length;
        fetchChatHistory();
        initializeUserStatus(post.userId);
        socket.emit('joinConversation', conversationId.value);
        if (totalMessage > 0) {
            markMessagesAsSeen(conversationId.value, currentUserId!);
        }
        showChat.value = true;
    } catch (error) {
        //console.error('Failed to open chat:', error);
    } finally {
        
    }
};

const fetchChatHistory = () => {
    if (conversationId.value) {
        socket.emit('fetchChatHistory', conversationId.value);
    }
};
watch(() => postChatDict, () => {
    fetchChatHistory();
}, { immediate: true });

socket.on('chatHistory', (fetchPostId: string, fetchConversationId: string, fetchMessages: any[]) => {
    if (conversationId.value) {
        postChatDict[fetchPostId] = [fetchConversationId, fetchMessages];
    }
});

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
            socket.emit('sendMessage', newMessage);
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
            socket.emit('sendMessage', newMessage);
            messageInput.value = '';
            scrollToBottom(postId);
        }
        messageInput.style.height = '2.3rem';
    }
};

watch(() => postChatDict[conversationPostId.value], () => {
    nextTick(() => {
        setTimeout(() => {
            if (showChat.value && postsWithOpenChat.some(postsWithOpenChat => postsWithOpenChat['postId'] === conversationPostId.value)) {
                scrollToBottom(conversationPostId.value);
            }
        }, 10);
    });
}, { immediate: true });

socket.on('newMessage', (newMessage) => {
    const postId = newMessage.postId;
    if (postChatDict[postId]) {
        postChatDict[postId][1].push(newMessage.messages[newMessage.messages.length - 1]);
    }
    if (newMessage.messages[newMessage.messages.length - 1].userId === currentUserId) {
        scrollToBottom(postId);
    }
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

watch(() => postsWithOpenChat, () => {
    postsWithOpenChat.forEach((post) => {
        initializeUserStatus(post.postUserId);
    });
}, { immediate: true });

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

// Listen for real-time messages status updates
const updateMessagesAsSeen = (thisConversationId: string) => {
    markMessagesAsSeen(thisConversationId, currentUserId!);
};
socket.on('updateMessageStatus', (conversation, totalSeen) => {
    const postId = conversation.postId;
    const myLastMessage = conversation.messages[conversation.messages.length - 1];
    if (postChatDict[postId] && myLastMessage.userId === currentUserId && myLastMessage.status === 'seen') {
        postChatDict[postId][1][postChatDict[postId][1].length - 1].status = 'seen';
    }
});

//Handle single message click
const handleSingleMessageClick = (messageId: string) => {
    const messageElement = document.querySelector(`.messId-${messageId}`);
    if (messageElement) {
        if ((messageElement as HTMLElement).style.display === 'none') {
            (messageElement as HTMLElement).style.display = 'block';
        } else {
            (messageElement as HTMLElement).style.display = 'none';
        }
    }
};

// Delete single chat
const deleteSingleChat = (event: MouseEvent, deleteConversationId: string, deletedPostId: string, convPostUserId: string) => {
    if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
        event.stopPropagation();
        socket.emit('deleteConversation', deleteConversationId, deletedPostId, currentUserId, convPostUserId);
    }
};
socket.on('conversationDeleted', (conversationId, deletePostId, myUnseenLeft) => {
    postsWithOpenChat.forEach((post, index) => {
        if (post.postId === deletePostId) {
            postsWithOpenChat.splice(index, 1);
        }
    });
});

// Handle emoji picker
const toggleEmojiPicker = (postId: string) => {
    const emojiPicker = document.querySelector(`.emoji-picker-${postId}`) as HTMLElement;
    if (emojiPicker) {
        emojiPicker.hidden = !emojiPicker.hidden;
    }
};
const addEmoji = (emoji: EmojiExt, postId: string) => {
    const messageInput = document.getElementById(`messageInput-${postId}`) as HTMLTextAreaElement;
    messageInput.value += emoji.i;
    messageInput.focus();
};

// Handle file input
const triggerFileInputClick = (postId: string) => {
    const fileInput = document.getElementById(`file-input-${postId}`) as HTMLInputElement;
    fileInput.click();
};

const selectedMedia = ref<File[]>([]);
const ImageReady = ref(true);
const handleFileInputChange = async (event: Event, postId: string, postUsernameCheck: string, postConversationId: string) => {
    ImageReady.value = false;
    scrollToBottom(postId);
    selectedMedia.value = [];
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const newFilesOriginal = Array.from((event.target as HTMLInputElement).files as FileList);
    const newFiles = newFilesOriginal.map((file) => {
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.split('.').pop();
        const newFileName = fileName.replace(`.${fileExtension}`, `.${fileExtension?.toLowerCase()}`);
        return new File([file], newFileName, { type: file.type });
    });
    if (!newFiles.length){
        ImageReady.value = true;
        return;
    };
    const validFiles = newFiles.filter((file) => {
        const isValidType = (file.type.startsWith('image/') && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(file.type.split('/')[1])) || 
        (file.type.startsWith('video/') && ['mp4', 'webm', 'avi', 'quicktime'].includes(file.type.split('/')[1]));
        return isValidType && file.size <= MAX_FILE_SIZE;
    });
    const heicFiles = newFiles.filter((file) => file.name.toLocaleLowerCase().endsWith('.heic') || file.name.toLocaleLowerCase().endsWith('.heif'));
    const invalidFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length) {
        alert(`The following files exceed the maximum file size of 20MB: ${invalidFiles.map((file) => file.name).join(', ')}`);
    }
    if (!validFiles.length && !heicFiles.length) {
        ImageReady.value = true;
        alert('Invalid file(s) selected. Please select images or videos only.')
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
                    resolve(convertedFile);
                })
                .catch((error) => {
                    //console.error(error);
                    reject(error);
                });
            });
        });
        await Promise.all(compressHeicf);
    }
    const compressionTasks = validFiles.map((file) => {
        if (file.type.startsWith('video/')) {
            selectedMedia.value.push(file);
            return Promise.resolve(file);
        } else {
            return new Promise((resolve, reject) => {
                new Compressor(file, {
                    quality: 0.3,
                    success(result) {
                        const compressedFiles = new File([result], file.name, { type: file.type });
                        selectedMedia.value.push(compressedFiles);
                        resolve(compressedFiles);
                    },
                    error(error) {
                        //console.error(error.message);
                        reject(error);
                    },
                });
            });
        }
    });

    const compressedFiles = await Promise.all(compressionTasks);

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
    socket.emit('sendMessage', newMessage);
    scrollToBottom(postId);
    ImageReady.value = true;
};

const onMediaError = (event: Event, message: string) => {
    const target = event.target as HTMLImageElement | HTMLVideoElement;
    const boldItalicMessage = document.createElement('strong');
    boldItalicMessage.innerHTML = `<em>${message}</em>`;
    target.parentNode?.replaceChild(boldItalicMessage, target);
};
</script>

<template>
    <div class="post-container" ref="postContainer">
        <div class="post" v-for="post in posts" :key="post._id" :id="`post-${post._id}`">
            <div class="just-post">
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
                        <button class="btn-post-option btn-post-share" v-if="showFaShare !== post._id && isThisPost !== post._id" title="Share" @click="sharePost(post._id)">
                            <FaShare />
                        </button>
                        <Transition name="fade-icon">
                            <button v-if="isThisPost === post._id" class="btn-post-option btn-post-copy" title="URL Copied">
                                <FaCopy /> Link Copied
                            </button>
                        </Transition>
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
                        <p class="post-detail-price">{{ post.price ? '$' + parseFloat(post.price).toFixed(2) : 'Free' }}</p>
                        <p class="post-detail-status" :class="{
                            'available': post.status === 'Available',
                            'sold': post.status === 'Sold',
                            'not-available': post.status === 'Not Available',
                            'looking-for': post.status === 'Looking For...'
                        }">{{ post.status }}</p>
                        <p class="post-detail-location" v-if="post.location">at {{ post.location }}</p>
                    </div>
                    <div class="send-message" v-if="post.username !== currentUser && currentUserId">
                        <p v-if="isLoadingChat[post._id]" class="btn-message loader"></p>
                        <p v-else-if="!postsWithOpenChat.some(postsWithOpenChat => postsWithOpenChat['postId'] === post._id)" class="btn-message" @click="togglePostChat(post)"><span>Send Message </span>
                            <Send />
                        </p>
                        <p v-else class="btn-message" @click="togglePostChat(post)">Close Message</p>
                    </div>
                </div>
            </div>
            <div v-if="showChat && postsWithOpenChat.some(postsWithOpenChat => postsWithOpenChat['postId'] === post._id) && postChatDict[post._id]">
                <div class="center">
                    <div class="chat" @click="updateMessagesAsSeen(postChatDict[post._id][0])">
                        <div class="contact-bar-header">
                            <div class="contact bar">
                                <div class="post-user-img" :style="`background-image: url(${post.userImg});`"></div>
                                <div class="post-username">{{ post.username }}</div>
                                <div v-if="userStatusStore.userStatuses[post.userId]">
                                    <div v-if="userStatusStore.userStatuses[post.userId].status === 'Online'" class="post-userstatus online">&#11044; {{ userStatusStore.userStatuses[post.userId].status }}</div>
                                    <div v-else-if="userStatusStore.userStatuses[post.userId].status === 'Offline'" class="post-userstatus offline">&#11044; {{ timeAgo(userStatusStore.userStatuses[post.userId].lastActive) }}</div>
                                </div>
                            </div>
                            <div class="delete-this-chat">
                                <svg @click="deleteSingleChat($event, postChatDict[post._id][0], post._id, post.userId)" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 448 512">
                                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="scroll-down-button" @click="scrollToBottom(post._id)">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                                <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/>
                            </svg>
                        </div>
                        <div v-if="showChat && postsWithOpenChat.some(postsWithOpenChat => postsWithOpenChat['postId'] === post._id) && postChatDict[post._id]" :id="`chat-${post._id}`" class="messages">
                            <div class="message" v-for="message in postChatDict[post._id][1] as any" :class="message.username === post.username ? 'post-mess' : 'my-mess'" :key="message._id" @click="handleSingleMessageClick(message._id)">
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
                            <div v-if="postChatDict[post._id][1].length > 0 && postChatDict[post._id][1][postChatDict[post._id][1].length - 1].userId === currentUserId && postChatDict[post._id][1][postChatDict[post._id][1].length - 1].status === 'seen'" class="seen-container">
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
                        <div :class="`emoji-picker emoji-picker-${post._id}`" hidden>
                            <EmojiPicker :disabled-groups="['flags']" @select="(emoji: EmojiExt) => addEmoji(emoji, post._id)" @close="toggleEmojiPicker" />
                        </div>
                        <div class="input">
                            <FaCamera @click="triggerFileInputClick(post._id)" />
                            <input :id="`file-input-${post._id}`" type="file" accept="image/*, image/heic, image/heif, video/mp4" multiple @change="handleFileInputChange($event, post._id, post.username, postChatDict[post._id][0])" style="display: none" />
                            <FaLaugh @click="toggleEmojiPicker(post._id)" />
                            <textarea :id="`messageInput-${post._id}`" placeholder="Type your message here!" @input="resizeTextarea" @keydown.enter="sendMessage($event, post._id, post.username, postChatDict[post._id][0])"></textarea>
                            <FaSend @click="sendMessage($event, post._id, post.username, postChatDict[post._id][0])" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="isFetching && hasMorePosts && posts.length > 0" class="loading">
            Loading more posts...
        </div>
    </div>
</template>

<style scoped>
.post-container {
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 87vh;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    margin-top: 65px;
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
    display: flex;
    justify-content: center;
    align-items: center;
    width: 1000px;
    margin-top: 10px;
    padding: 0 10px;
    box-sizing: border-box;
    gap: 10px;
}
.just-post {
    width: 600px;
    border: solid 1px white;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 5px;
    margin-top: 5px;
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
.btn-post-share:hover {
    color: #23ffed;
    transition: color 0.3s ease;
}
.fade-icon-enter-active,
.fade-icon-leave-active {
    transition: opacity 0.3s;
}

.fade-icon-enter-from,
.fade-icon-leave-to {
    opacity: 0;
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
.post-user p {
    margin-left: 5px;
}
.post-user h3:hover {
    cursor: pointer;
    text-decoration: underline;
}
.post-topic p {
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: bold;
    color: white;
    border: none;
    border-bottom: 1px solid #ccc;
}
.post-caption {
    margin-top: -5px;
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
    margin-top: 15px;
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
    margin-top: -10px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.btn-message:hover {
    background-color: #0f5aff;
    transition: background-color 0.3s ease;
}
.btn-message span {
    font-weight: bold;
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

/* HTML: <div class="loader"></div> */
.loader {
    width: 120px;
    height: 22px;
    border-radius: 40px;
    color: #ffffff;
    border: 2px solid;
    position: relative;
}
.loader::before {
    content: "";
    position: absolute;
    margin: 2px;
    width: 25%;
    top: 0;
    bottom: 0;
    left: 0;
    border-radius: inherit;
    background: currentColor;
    animation: l3 1s infinite linear;
}
@keyframes l3 {
    50% {left:100%;transform: translateX(calc(-100% - 4px))}
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

/* Chat Section */
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
    padding-left: 4rem;
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
    font-size: 1.025rem;
    font-weight: 600;
    margin-left: 0.1rem;
    margin-bottom: -0.1rem;
    color: white;
}
.contact .message, .contact {
    font-size: 0.9rem;
    color: #999;
}
.chat {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 24rem;
    height: 30rem;
    z-index: 2;
    box-sizing: border-box;
    border-radius: 1rem;
    background: #333;
    box-shadow: 0 0 8rem 0 rgba(0, 0, 0, 0.1), 0rem 2rem 4rem -3rem rgba(0, 0, 0, 0.5);
}
.contact-bar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -0.9rem;
    margin-bottom: -1rem;
}
.chat .contact.bar {
    flex-basis: 2rem;
    flex-shrink: 0;
    margin: 1rem;
    box-sizing: border-box;
}
.post-userstatus {
    white-space: nowrap;
}
.post-userstatus.online {
    color: rgb(10, 255, 51);
}
.post-userstatus.offline {
    color: #666;
}
.delete-this-chat svg {
    margin-right: 2rem;
    cursor: pointer;
    z-index: 1;
}
.delete-this-chat svg {
    fill: #999;
    transition: fill ease-in-out 0.2s;
}
.delete-this-chat svg:hover {
    fill: #ff0000;
    transition: fill ease-in-out 0.2s;
}
.chat .messages {
    height: 22rem;
    padding: 1rem;
    background: #212529;
    flex-shrink: 2;
    overflow-y: auto;
    box-shadow: inset 0 2rem 2rem -2rem rgba(0, 0, 0, 0.05), inset 0 -2rem 2rem -2rem rgba(0, 0, 0, 0.05);
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
    margin: -0.7rem 0rem 1rem auto;
    border-radius: 1.125rem 1.125rem 0 1.125rem;
    background: #333;
    color: white;
}
.chat .messages .message.post-mess {
    margin: -0.7rem auto 1rem 0rem;
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
.chat .input textarea {
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
.chat .input textarea::placeholder {
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
    margin: -1.3rem -0.5rem -1rem auto;
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

@media screen and (max-height: 800px) and (min-width: 600px) {
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
    .post:last-child {
        margin-bottom: 2em;
    }
    .loading {
        margin-bottom: 2em;
    }

    .chat {
        height: 30rem;
    }
    .scroll-down-button {
        top: 5rem;
    }
    .message-media-items img, .message-media-items video {
        height: 200px;
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
    .post:last-child {
        margin-bottom: 7em;
    }
    .loading {
        margin-bottom: 7em;
    }

    .chat {
        height: 30rem;
    }
    .scroll-down-button {
        top: 5rem;
    }
    .message-media-items img, .message-media-items video {
        height: 200px;
    }
}
@media screen and (max-width: 1020px) {
    .just-post {
        width: 500px;
    }
    .chat {
        height: 28rem;
    }
}
@media screen and (max-width: 920px) {
    .just-post {
        width: 450px;
    }
    .chat {
        height: 26rem;
    }  
}
@media screen and (max-width: 870px) {
    .post {
        display: flex;
        flex-direction: column;
    }
    .just-post {
        width: 700px;
    }
    .message-media-items img, .message-media-items video {
        height: 200px;
    }
    .emoji-picker {
        right: 3rem;
    }
}
@media screen and (max-width: 725px) {
    .just-post {
        width: 500px;
    }
}
@media screen and (max-width: 600px) {
    .just-post {
        width: 400px;
    }
    .btn-message span {
        display: none;
    }
    .chat {
        height: 28rem;
    }

    .post-user-info {
        font-size: 12px;
        margin-left: -5px;
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
        gap: 5px;
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
    .messages .message {
        font-size: 12px;
    }
    .chat .input textarea {
        font-size: 12px;
    }
    .chat .input textarea::placeholder {
        font-size: 9px;
        padding-top: 3px;
    }
}
@media screen and (max-width: 500px) {
    .post {
        width: 400px;
    }
    .just-post {
        width: 400px;
    }
}
@media screen and (max-width: 400px) {
    .just-post {
        width: 350px;
    }
}
@media screen and (max-width: 350px) {
    .just-post {
        width: 330px;
    }
    .chat {
        height: 24rem;
        width: 20rem;
    }
}
</style>
